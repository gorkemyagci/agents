import { openai } from "@ai-sdk/openai";
import { getTracer } from "@lmnr-ai/lmnr";
import { type ModelMessage, streamText } from "ai";
import type { AgentCallbacks, ToolCallInfo } from "../types.ts";
import {
  calculateUsagePercentage,
  compactConversation,
  DEFAULT_THRESHOLD,
  estimateMessagesTokens,
  getModelLimits,
  isOverThreshold,
} from "./context/index.ts";
import { executeTool } from "./executeTool.ts";
import { filterCompatibleMessages } from "./system/filterMessages.ts";
import { SYSTEM_PROMPT } from "./system/prompt.ts";
import { tools } from "./tools/index.ts";

const MODEL_NAME = "gpt-5-mini";

// Strip execute so the SDK doesn't run tools itself; we run them via executeTool
const modelTools = Object.fromEntries(
  Object.entries(tools).map(([name, t]) => [
    name,
    { ...t, execute: undefined },
  ]),
) as typeof tools;

export async function runAgent(
  userMessage: string,
  conversationHistory: ModelMessage[],
  callbacks: AgentCallbacks,
): Promise<ModelMessage[]> {
  const modelLimits = getModelLimits(MODEL_NAME);
  const workingHistory = filterCompatibleMessages(conversationHistory);
  let messages: ModelMessage[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    ...workingHistory,
    { role: "user", content: userMessage },
  ];

  const precheckTokens = estimateMessagesTokens(messages);
  if (isOverThreshold(precheckTokens.total, modelLimits.contextWindow)) {
    const summary = await compactConversation(workingHistory, MODEL_NAME);
    messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...summary,
      { role: "user", content: userMessage },
    ];
  }

  let fullResponse = "";

  while (true) {
    const result = streamText({
      model: openai(MODEL_NAME),
      messages,
      tools: modelTools,
      // Errors are handled from the stream below; the default handler would
      // print to the console and corrupt the terminal UI
      onError: () => {},
      experimental_telemetry: {
        isEnabled: true,
        tracer: getTracer(),
      },
    });

    const reportTokenUsage = () => {
      if (callbacks.onTokenUsage) {
        const usage = estimateMessagesTokens(messages);
        callbacks.onTokenUsage({
          inputTokens: usage.input,
          outputTokens: usage.output,
          totalTokens: usage.total,
          contextWindow: modelLimits.contextWindow,
          threshold: DEFAULT_THRESHOLD,
          percentage: calculateUsagePercentage(
            usage.total,
            modelLimits.contextWindow,
          ),
        });
      }
    };

    const toolCalls: ToolCallInfo[] = [];
    let currentText = "";

    for await (const chunk of result.fullStream) {
      if (chunk.type === "text-delta") {
        currentText += chunk.text;
        callbacks.onToken(chunk.text);
      }
      if (chunk.type === "tool-call") {
        const input = "input" in chunk ? chunk.input : {};
        toolCalls.push({
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          args: input as Record<string, unknown>,
        });
        callbacks.onToolCallStart(chunk.toolName, input);
      }
      // Surface the real error to the caller (the UI shows it); text already
      // streamed stays on screen
      if (chunk.type === "error") {
        throw chunk.error instanceof Error
          ? chunk.error
          : new Error(String(chunk.error));
      }
    }

    fullResponse += currentText;

    const finishReason = await result.finishReason;

    if (finishReason !== "tool-calls" || toolCalls.length === 0) {
      const responseMessages = await result.response;
      messages.push(...responseMessages.messages);
      reportTokenUsage();
      break;
    }

    const responseMessages = await result.response;
    messages.push(...responseMessages.messages);
    reportTokenUsage();

    let rejected = false;

    for (const [index, tc] of toolCalls.entries()) {
      const approved = await callbacks.onToolApproval(tc.toolName, tc.args);
      if (!approved) {
        rejected = true;
        // Every tool call needs a result, so tell the model this call and
        // the ones after it in the batch were not run
        messages.push({
          role: "tool",
          content: toolCalls.slice(index).map((skipped) => ({
            type: "tool-result",
            toolCallId: skipped.toolCallId,
            toolName: skipped.toolName,
            output: { type: "text", value: "User denied this tool call" },
          })),
        });
        break;
      }
      const result = await executeTool(tc.toolName, tc.args);
      callbacks.onToolCallEnd(tc.toolName, result);
      messages.push({
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            output: { type: "text", value: result },
          },
        ],
      });
      reportTokenUsage();
    }

    if (rejected) {
      break;
    }
  }

  callbacks.onComplete(fullResponse);
  // System prompt is re-added each turn, so keep it out of the returned history
  return messages.filter((m) => m.role !== "system");
}
