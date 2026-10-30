import type { ModelMessage } from "ai";
import { describe, expect, it } from "vitest";
import {
  calculateUsagePercentage,
  estimateMessagesTokens,
  estimateTokens,
  extractMessageText,
  getModelLimits,
  isOverThreshold,
} from "../src/agent/context/index.ts";

describe("estimateTokens", () => {
  it("divides character count by 3.75 and rounds up", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("abc")).toBe(1);
    expect(estimateTokens("a".repeat(375))).toBe(100);
  });
});

describe("extractMessageText", () => {
  it("returns string content as-is", () => {
    expect(extractMessageText({ role: "user", content: "hi" })).toBe("hi");
  });

  it("joins text parts and tool-result values", () => {
    const message: ModelMessage = {
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolCallId: "1",
          toolName: "readFile",
          output: { type: "text", value: "file body" },
        },
      ],
    };
    expect(extractMessageText(message)).toBe("file body");
  });
});

describe("estimateMessagesTokens", () => {
  it("counts assistant messages as output and everything else as input", () => {
    const usage = estimateMessagesTokens([
      { role: "system", content: "a".repeat(375) },
      { role: "user", content: "a".repeat(375) },
      { role: "assistant", content: "a".repeat(375) },
    ]);
    expect(usage).toEqual({ input: 200, output: 100, total: 300 });
  });
});

describe("getModelLimits", () => {
  it("returns exact matches", () => {
    expect(getModelLimits("gpt-5-mini").contextWindow).toBe(400000);
  });

  it("falls back to gpt-5 for gpt-5 variants", () => {
    expect(getModelLimits("gpt-5-nano").contextWindow).toBe(400000);
  });

  it("uses default limits for unknown models", () => {
    expect(getModelLimits("unknown").contextWindow).toBe(128000);
  });
});

describe("threshold helpers", () => {
  it("is over threshold at exactly 80% of the window", () => {
    expect(isOverThreshold(799, 1000)).toBe(false);
    expect(isOverThreshold(800, 1000)).toBe(true);
  });

  it("calculates usage as a percentage", () => {
    expect(calculateUsagePercentage(250, 1000)).toBe(25);
  });
});
