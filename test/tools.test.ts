import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { ToolCallOptions } from "ai";
import { describe, expect, it } from "vitest";
import { deleteFile, writeFile } from "../src/agent/tools/file.ts";
import { tools } from "../src/agent/tools/index.ts";
import { runCommand } from "../src/agent/tools/shell.ts";

const options: ToolCallOptions = { toolCallId: "1", messages: [] };

describe("tool descriptions", () => {
  it("contain no known typos", () => {
    const text = Object.values(tools)
      .map((t) => ("description" in t ? t.description : ""))
      .join("\n");
    for (const typo of ["is's", "doesn not", "ovewrite", "Succesfully"]) {
      expect(text).not.toContain(typo);
    }
  });
});

describe("file tools", () => {
  it("report successful writes and deletes", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "agents-test-"));
    const file = path.join(dir, "a.txt");

    expect(
      await writeFile.execute?.({ path: file, content: "abc" }, options),
    ).toBe(
      `Successfully wrote 3 characters to ${file}. You should verify by listing files`,
    );
    expect(await deleteFile.execute?.({ path: file }, options)).toBe(
      `Successfully deleted the file at ${file}`,
    );
  });
});

describe("runCommand", () => {
  it("reports the exit code and output of a failed command", async () => {
    const result = await runCommand.execute?.(
      { command: "echo oops; exit 2" },
      options,
    );
    expect(result).toBe("Command failed (exit code 2):\noops\n");
  });
});
