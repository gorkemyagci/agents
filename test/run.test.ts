import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { LanguageModel, ModelMessage } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentCallbacks } from "../src/types.ts";
import { scriptedModel, textResponse, toolCallResponse } from "./helpers.ts";

const mocks = vi.hoisted(() => ({ model: undefined as unknown }));

vi.mock("@ai-sdk/openai", () => ({
  openai: Object.assign(() => mocks.model as LanguageModel, {
    tools: { webSearch: () => ({ type: "provider-defined" }) },
  }),
}));

vi.mock("@lmnr-ai/lmnr", () => ({
  getTracer: () => undefined,
}));

const { runAgent } = await import("../src/agent/run.ts");

function callbacks(approve = true) {
  return {
    onToken: vi.fn(),
    onToolCallStart: vi.fn(),
    onToolCallEnd: vi.fn(),
    onComplete: vi.fn(),
    onToolApproval: vi.fn(async () => approve),
    onTokenUsage: vi.fn(),
  } satisfies AgentCallbacks;
}

describe("runAgent", () => {
  let tmpFile: string;

  beforeEach(async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "agents-test-"));
    tmpFile = path.join(dir, "note.txt");
    await fs.writeFile(tmpFile, "file body");
  });

  it("streams a text answer and returns history without the system prompt", async () => {
    mocks.model = scriptedModel([textResponse("Hello")]);
    const cb = callbacks();

    const history = await runAgent("hi", [], cb);

    expect(cb.onToken).toHaveBeenCalledWith("Hello");
    expect(cb.onComplete).toHaveBeenCalledWith("Hello");
    expect(history.map((m) => m.role)).toEqual(["user", "assistant"]);
  });

  it("runs an approved tool and sends its result back to the model", async () => {
    const model = scriptedModel([
      toolCallResponse([
        { id: "c1", name: "readFile", input: { path: tmpFile } },
      ]),
      textResponse("Done"),
    ]);
    mocks.model = model;
    const cb = callbacks(true);

    const history = await runAgent("read it", [], cb);

    expect(cb.onToolApproval).toHaveBeenCalledWith("readFile", {
      path: tmpFile,
    });
    expect(cb.onToolCallEnd).toHaveBeenCalledWith("readFile", "file body");
    expect(cb.onComplete).toHaveBeenCalledWith("Done");
    expect(model.calls).toHaveLength(2);
    expect(history.map((m) => m.role)).toEqual([
      "user",
      "assistant",
      "tool",
      "assistant",
    ]);
  });

  it("stops without running the tool when the user rejects it", async () => {
    const model = scriptedModel([
      toolCallResponse([
        { id: "c1", name: "readFile", input: { path: tmpFile } },
      ]),
    ]);
    mocks.model = model;
    const cb = callbacks(false);

    await runAgent("read it", [], cb);

    expect(cb.onToolCallEnd).not.toHaveBeenCalled();
    expect(cb.onComplete).toHaveBeenCalledWith("");
    expect(model.calls).toHaveLength(1);
  });

  it("keeps the system prompt and the new user message after compaction", async () => {
    const model = scriptedModel([textResponse("Answer")], "SUMMARY");
    mocks.model = model;
    // Large enough to cross the 80% threshold of the 400k-token window
    const history: ModelMessage[] = [
      { role: "user", content: "x".repeat(1_300_000) },
      { role: "assistant", content: "ok" },
    ];

    await runAgent("next question", history, callbacks());

    const prompt = model.calls[0].prompt;
    expect(prompt[0].role).toBe("system");
    expect(JSON.stringify(prompt)).toContain("SUMMARY");
    expect(JSON.stringify(prompt.at(-1))).toContain("next question");
  });

  it("answers every tool call in the history when the user rejects one", async () => {
    mocks.model = scriptedModel([
      toolCallResponse([
        { id: "c1", name: "listFiles", input: { directory: "." } },
        { id: "c2", name: "listFiles", input: { directory: ".." } },
      ]),
    ]);
    const cb = callbacks(false);

    const history = await runAgent("list", [], cb);

    const parts = history.flatMap<{ type: string; toolCallId?: string }>((m) =>
      Array.isArray(m.content) ? m.content : [],
    );
    const callIds = parts
      .filter((p) => p.type === "tool-call")
      .map((p) => p.toolCallId);
    const results = parts.filter((p) => p.type === "tool-result");
    expect(results.map((r) => r.toolCallId)).toEqual(callIds);
    expect(JSON.stringify(results)).toContain("User denied this tool call");
    // Only the first call is shown for approval; the rest are skipped
    expect(cb.onToolApproval).toHaveBeenCalledTimes(1);
  });

  it("surfaces stream errors to the caller without writing to the console", async () => {
    mocks.model = scriptedModel([
      [
        { type: "stream-start", warnings: [] },
        { type: "text-start", id: "t1" },
        { type: "text-delta", id: "t1", delta: "Partial" },
        { type: "error", error: new Error("rate limited") },
      ],
    ]);
    const cb = callbacks();
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(runAgent("hi", [], cb)).rejects.toThrow("rate limited");

    expect(cb.onToken).toHaveBeenCalledWith("Partial");
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    log.mockRestore();
    error.mockRestore();
  });
});
