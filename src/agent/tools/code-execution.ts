import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { tool } from "ai";
import { z } from "zod";

/**
 * Execute code by writing to temp file and running it
 * This is a composite tool that demonstrates doing multiple steps internally
 * vs letting the model orchestrate separate tools (writeFile + runCommand)
 */
export const executeCode = tool({
  description:
    "Execute code for anything you need compute for. Supports JavaScript (Node.js), Python, and TypeScript. Returns the output of the execution.",
  inputSchema: z.object({
    code: z.string().describe("The code to execute"),
    language: z
      .enum(["javascript", "python", "typescript"])
      .describe("The programming language of the code")
      .default("javascript"),
  }),
  execute: async ({
    code,
    language,
  }: {
    code: string;
    language: "javascript" | "python" | "typescript";
  }) => {
    // Determine file extension and run command based on language
    const extensions: Record<string, string> = {
      javascript: ".js",
      python: ".py",
      typescript: ".ts",
    };

    // Program and arguments, run without a shell
    const commands: Record<string, (file: string) => string[]> = {
      javascript: (file) => ["node", file],
      python: (file) => ["python3", file],
      typescript: (file) => ["npx", "tsx", file],
    };

    const ext = extensions[language];
    const getCommand = commands[language];
    // Private (0700) directory with a random name, so the file can't be
    // pre-created or swapped by another user
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "code-exec-"));
    const tmpFile = path.join(tmpDir, `main${ext}`);

    try {
      // Write code to temp file
      await fs.writeFile(tmpFile, code, {
        encoding: "utf-8",
        flag: "wx",
        mode: 0o600,
      });

      // Execute the code
      const [program, ...args] = getCommand(tmpFile);
      const result = spawnSync(program, args, { encoding: "utf-8" });
      if (result.error) {
        throw result.error;
      }

      let output = "";
      if (result.stdout) {
        output += result.stdout;
      }
      if (result.stderr) {
        output += result.stderr;
      }

      if (result.status !== 0) {
        return `Execution failed (exit code ${result.status}):\n${output}`;
      }

      return output || "Code executed successfully (no output)";
    } catch (error) {
      const err = error as Error;
      return `Error executing code: ${err.message}`;
    } finally {
      // Clean up temp directory
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  },
});
