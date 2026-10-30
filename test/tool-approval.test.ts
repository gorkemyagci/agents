import { describe, expect, it } from "vitest";
import { getArgsSummary } from "../src/ui/components/tool-approval.tsx";

describe("getArgsSummary", () => {
  it("prefers a meaningful key over the first key", () => {
    expect(getArgsSummary({ other: "x", path: "src/a.ts" })).toBe("src/a.ts");
  });

  it("falls back to the first string value", () => {
    expect(getArgsSummary({ other: "x" })).toBe("x");
  });

  it("truncates long values to 50 characters plus an ellipsis", () => {
    expect(getArgsSummary({ command: "a".repeat(60) })).toBe(
      `${"a".repeat(50)}...`,
    );
  });

  it("stringifies non-object args and returns empty for no strings", () => {
    expect(getArgsSummary(42)).toBe("42");
    expect(getArgsSummary({ n: 1 })).toBe("");
  });
});
