import type { ModelMessage } from "ai";
import { describe, expect, it } from "vitest";
import { filterCompatibleMessages } from "../src/agent/system/filterMessages.ts";

describe("filterCompatibleMessages", () => {
  it("keeps user, system, tool and non-empty assistant messages", () => {
    const messages: ModelMessage[] = [
      { role: "system", content: "sys" },
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
      {
        role: "assistant",
        content: [
          {
            type: "tool-call",
            toolCallId: "1",
            toolName: "readFile",
            input: {},
          },
        ],
      },
      {
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: "1",
            toolName: "readFile",
            output: { type: "text", value: "x" },
          },
        ],
      },
    ];
    expect(filterCompatibleMessages(messages)).toEqual(messages);
  });

  it("drops assistant messages without text or tool calls", () => {
    const messages: ModelMessage[] = [
      { role: "assistant", content: "   " },
      { role: "assistant", content: [{ type: "text", text: "" }] },
    ];
    expect(filterCompatibleMessages(messages)).toEqual([]);
  });
});
