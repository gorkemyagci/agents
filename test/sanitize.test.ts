import { describe, expect, it } from "vitest";
import { stripControlChars } from "../src/ui/sanitize.ts";

describe("stripControlChars", () => {
  it("keeps plain text, newlines and tabs", () => {
    expect(stripControlChars("a\tb\nc ✓ é")).toBe("a\tb\nc ✓ é");
  });

  it("removes ANSI color and cursor sequences", () => {
    expect(stripControlChars("\x1b[31mred\x1b[0m\x1b[2J\x1b[1;1H")).toBe("red");
  });

  it("removes OSC sequences such as window titles and hyperlinks", () => {
    expect(stripControlChars("\x1b]0;pwned\x07ok")).toBe("ok");
    expect(
      stripControlChars("\x1b]8;;https://evil\x1b\\link\x1b]8;;\x1b\\"),
    ).toBe("link");
  });

  it("removes other C0 and C1 controls, carriage returns and DEL", () => {
    expect(stripControlChars("a\x07b\x08c\rd\x7fe\x85f\x00g")).toBe("abcdefg");
  });
});
