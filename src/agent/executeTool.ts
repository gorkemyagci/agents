import type { ToolCallOptions } from "ai";
import { tools } from "./tools/index.ts";

export type ToolName = keyof typeof tools;

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  const tool = tools[name as ToolName];

  if (!tool) {
    return `Unknown tool: ${name}`;
  }

  const execute = tool.execute;
  if (!execute) {
    // Provider tools (like webSearch) are executed by OpenAI, not us
    return `Provider tool ${name} - executed by model provider`;
  }

  // Tools have different input types; args were validated against the
  // tool's schema by the SDK before reaching here
  const run = execute as (
    input: Record<string, unknown>,
    options: ToolCallOptions,
  ) => unknown;
  const result = await run(args, {
    toolCallId: "",
    messages: [],
  });

  return String(result);
}
