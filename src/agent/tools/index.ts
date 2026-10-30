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
