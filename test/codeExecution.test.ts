import fs from "node:fs/promises";
import os from "node:os";
import type { ToolCallOptions } from "ai";
import { describe, expect, it } from "vitest";
import { executeCode } from "../src/agent/tools/code-execution.ts";

const options: ToolCallOptions = { toolCallId: "1", messages: [] };

async function run(code: string) {
  return executeCode.execute?.({ code, language: "javascript" }, options);
}

async function leftoverEntries() {
  const entries = await fs.readdir(os.tmpdir());
  return entries.filter((e) => e.startsWith("code-exec-"));
}

describe("executeCode", () => {
  it("returns stdout of the program", async () => {
    expect(await run("console.log(1 + 1)")).toBe("2\n");
  });

  it("reports a non-zero exit code with output", async () => {
    const result = await run("console.error('boom'); process.exit(3)");
    expect(result).toBe("Execution failed (exit code 3):\nboom\n");
  });

  it("reports when the program prints nothing", async () => {
    expect(await run("")).toBe("Code executed successfully (no output)");
  });

  it("cleans up its temp files", async () => {
    const before = await leftoverEntries();
    await run("console.log('x')");
    expect(await leftoverEntries()).toEqual(before);
  });
});
