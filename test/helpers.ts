import type { LanguageModel } from "ai";

// The provider's model type, without depending on @ai-sdk/provider directly
type LanguageModelV2 = Exclude<LanguageModel, string>;
type DoStreamOptions = Parameters<LanguageModelV2["doStream"]>[0];
type LanguageModelV2StreamPart = Awaited<
  ReturnType<LanguageModelV2["doStream"]>
>["stream"] extends ReadableStream<infer T>
  ? T
  : never;

const usage = { inputTokens: 1, outputTokens: 1, totalTokens: 2 };

export function textResponse(text: string): LanguageModelV2StreamPart[] {
  return [
    { type: "stream-start", warnings: [] },
    { type: "text-start", id: "t1" },
    { type: "text-delta", id: "t1", delta: text },
    { type: "text-end", id: "t1" },
    { type: "finish", finishReason: "stop", usage },
  ];
}

export function toolCallResponse(
  calls: Array<{ id: string; name: string; input: unknown }>,
): LanguageModelV2StreamPart[] {
  return [
    { type: "stream-start", warnings: [] },
    ...calls.map(
      (c): LanguageModelV2StreamPart => ({
        type: "tool-call",
        toolCallId: c.id,
        toolName: c.name,
        input: JSON.stringify(c.input),
      }),
    ),
    { type: "finish", finishReason: "tool-calls", usage },
  ];
}

/**
 * Mock model that returns one scripted stream per call, in order.
 * Records the options of every call in `calls`.
 */
export function scriptedModel(responses: LanguageModelV2StreamPart[][]) {
  const calls: DoStreamOptions[] = [];
  const model: LanguageModelV2 & { calls: DoStreamOptions[] } = {
    specificationVersion: "v2",
    provider: "test",
    modelId: "test-model",
    supportedUrls: {},
    calls,
    doGenerate: async () => {
      throw new Error("doGenerate is not scripted");
    },
    doStream: async (options) => {
      calls.push(options);
      const chunks = responses[calls.length - 1];
      if (!chunks)
        throw new Error(`No scripted response for call ${calls.length}`);
      return {
        stream: new ReadableStream({
          start(controller) {
            for (const chunk of chunks) controller.enqueue(chunk);
            controller.close();
          },
        }),
      };
    },
  };
  return model;
}
