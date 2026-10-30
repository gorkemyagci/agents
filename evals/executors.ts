import { openai } from "@ai-sdk/openai";
import { generateText, type ModelMessage, stepCountIs, type ToolSet } from "ai";
import { SYSTEM_PROMPT } from "../src/agent/system/prompt.ts";
import { fileTools, shellTools } from "../src/agent/tools/index.ts";
import type {
  EvalData,
  MultiTurnEvalData,
  MultiTurnResult,
  SingleTurnResult,
} from "./types.ts";
import { buildMessages, buildMockedTools } from "./utils.ts";

/**
 * The agent's real tool definitions, without execute, so the LLM sees the
 * exact descriptions and schemas the app ships but nothing runs.
 */
const TOOL_DEFINITIONS: ToolSet = Object.fromEntries(
  Object.entries({ ...fileTools, ...shellTools }).map(([name, t]) => [
    name,
    { ...t, execute: undefined },
  ]),
);

/**
 * Single-turn executor with mocked tools.
 * Uses predefined tool definitions - tools never execute, only selection is tested.
 */
export async function singleTurnWithMocks(
  data: EvalData,
): Promise<SingleTurnResult> {
  const messages = buildMessages(data);

  // Expose only the tools this case asks for
  const tools: ToolSet = {};
  for (const toolName of data.tools) {
    const def = TOOL_DEFINITIONS[toolName];
    if (def) {
      tools[toolName] = def;
    }
  }

  const result = await generateText({
    model: openai(data.config?.model ?? "gpt-4o-mini"),
    messages,
    tools,
    stopWhen: stepCountIs(1),
    temperature: data.config?.temperature ?? undefined,
  });

  // Extract tool calls from the result
  const toolCalls = (result.toolCalls ?? []).map((tc) => ({
    toolName: tc.toolName,
    args: "args" in tc ? tc.args : {},
  }));

  const toolNames = toolCalls.map((tc) => tc.toolName);

  return {
    toolCalls,
    toolNames,
    selectedAny: toolNames.length > 0,
  };
}

/**
 * Multi-turn executor with mocked tools.
 * Runs a complete agent loop with tools returning fixed values.
 */

export async function multiTurnWithMocks(
  data: MultiTurnEvalData,
): Promise<MultiTurnResult> {
  const tools = buildMockedTools(data.mockTools);
  let messages: ModelMessage[];
  if (data.messages) {
    messages = data.messages;
  } else if (data.prompt !== undefined) {
    messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: data.prompt },
    ];
  } else {
    throw new Error("Multi-turn eval case needs either `messages` or `prompt`");
  }

  const result = await generateText({
    model: openai(data.config?.model ?? "gpt-5-mini"),
    messages,
    tools,
    stopWhen: stepCountIs(data.config?.maxSteps ?? 20),
  });

  const allToolCalls: string[] = [];
  const steps = result.steps.map((step) => {
    const stepToolCalls = (step.toolCalls ?? []).map((tc) => {
      allToolCalls.push(tc.toolName);
      return {
        toolName: tc.toolName,
        args: "args" in tc ? tc.args : {},
      };
    });

    const stepToolResults = (step.toolResults ?? []).map((tr) => ({
      toolName: tr.toolName,
      result: "result" in tr ? tr.result : tr,
    }));

    return {
      toolCalls: stepToolCalls.length > 0 ? stepToolCalls : undefined,
      toolResults: stepToolResults.length > 0 ? stepToolResults : undefined,
      text: step.text || undefined,
    };
  });

  const toolsUsed = [...new Set(allToolCalls)];
  return {
    text: result.text,
    steps,
    toolsUsed,
    toolCallOrder: allToolCalls,
  };
}
