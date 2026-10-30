import { describe, expect, it } from "vitest";
import {
  toolOrderCorrect,
  toolSelectionScore,
  toolsAvoided,
  toolsSelected,
} from "../evals/evaluators.ts";
import type { MultiTurnResult, SingleTurnResult } from "../evals/types.ts";

const single = (toolNames: string[]): SingleTurnResult => ({
  toolCalls: toolNames.map((toolName) => ({ toolName, args: {} })),
  toolNames,
  selectedAny: toolNames.length > 0,
});

const multi = (toolCallOrder: string[]): MultiTurnResult => ({
  text: "",
  steps: [],
  toolsUsed: [...new Set(toolCallOrder)],
  toolCallOrder,
});

describe("toolsSelected", () => {
  it("returns 1 only when every expected tool was selected", () => {
    const target = { expectedTools: ["readFile"], category: "golden" as const };
    expect(toolsSelected(single(["readFile", "listFiles"]), target)).toBe(1);
    expect(toolsSelected(single(["listFiles"]), target)).toBe(0);
  });
});

describe("toolsAvoided", () => {
  it("returns 0 when a forbidden tool was used", () => {
    const target = {
      forbiddenTools: ["runCommand"],
      category: "negative" as const,
    };
    expect(toolsAvoided(single(["runCommand"]), target)).toBe(0);
    expect(toolsAvoided(single([]), target)).toBe(1);
  });
});

describe("toolSelectionScore", () => {
  it("returns an F1 score of precision and recall", () => {
    const target = {
      expectedTools: ["readFile", "writeFile"],
      category: "secondary" as const,
    };
    // precision 1/2, recall 1/2 -> F1 0.5
    expect(toolSelectionScore(single(["readFile", "listFiles"]), target)).toBe(
      0.5,
    );
  });

  it("scores 0.5 when no tools were expected but some were selected", () => {
    const target = { category: "secondary" as const };
    expect(toolSelectionScore(single(["readFile"]), target)).toBe(0.5);
    expect(toolSelectionScore(single([]), target)).toBe(1);
  });
});

describe("toolOrderCorrect", () => {
  const target = {
    originalTask: "",
    expectedToolOrder: ["listFiles", "readFile"],
    mockToolResults: {},
    category: "task-completion" as const,
  };

  it("accepts the expected order with other tools in between", () => {
    expect(
      toolOrderCorrect(multi(["listFiles", "x", "readFile"]), target),
    ).toBe(1);
  });

  it("returns the fraction found in order", () => {
    expect(toolOrderCorrect(multi(["readFile", "listFiles"]), target)).toBe(
      0.5,
    );
  });
});
