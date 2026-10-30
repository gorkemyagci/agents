import { evaluate } from "@lmnr-ai/lmnr";
import dataset from "./data/agent-multiturn.json" with { type: "json" };
import { llmJudge } from "./evaluators";
import { multiTurnWithMocks } from "./executors";
import type {
  MultiTurnDatasetEntry,
  MultiTurnEvalData,
  MultiTurnResult,
  MultiTurnTarget,
} from "./types";

const executor = async (data: MultiTurnEvalData) => {
  return multiTurnWithMocks(data);
};

evaluate({
  // JSON imports infer per-entry literal shapes that TS cannot narrow to the
  // dataset type, so the cast goes through unknown
  data: dataset as unknown as MultiTurnDatasetEntry[],
  executor,
  evaluators: {
    outputQuality: async (
      output: MultiTurnResult,
      target: MultiTurnTarget | undefined,
    ) => {
      if (!target) return 1;
      return llmJudge(output, target);
    },
  },
  config: {
    projectApiKey: process.env.LMNR_PROJECT_API_KEY,
  },
  groupName: "agent-multiturn",
});
