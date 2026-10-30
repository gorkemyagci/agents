import { executeCode } from "./code-execution.ts";
import { deleteFile, listFiles, readFile, writeFile } from "./file.ts";
import { runCommand } from "./shell.ts";
import { webSearch } from "./web-search.ts";

// All tools combined for the agent
export const tools = {
  readFile,
  writeFile,
  listFiles,
  deleteFile,
  runCommand,
  executeCode,
  webSearch,
};

export { executeCode } from "./code-execution.ts";
// Export individual tools for selective use in evals
export { deleteFile, listFiles, readFile, writeFile } from "./file.ts";
export { runCommand } from "./shell.ts";
export { webSearch } from "./web-search.ts";

// Tool sets for evals
export const fileTools = {
  readFile,
  writeFile,
  listFiles,
  deleteFile,
};

export const shellTools = {
  runCommand,
};
