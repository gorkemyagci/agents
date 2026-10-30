import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { LanguageModel } from "ai";
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
  Laminar: { initialize: vi.fn() },
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
});
