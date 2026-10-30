import { evaluate } from "@lmnr-ai/lmnr";
import dataset from "./data/agent-multiturn.json" with { type: "json" };
import { llmJudge, toolOrderCorrect, toolsAvoided } from "./evaluators";
import { mutliTurnWithMocks } from "./executors";
import type {
  MultiTurnDatasetEntry,
  MultiTurnEvalData,
  MultiTurnResult,
  MultiTurnTarget,
} from "./types";

const executor = async (data: MultiTurnEvalData) => {
  return mutliTurnWithMocks(data);
};

evaluate({
  data: dataset as any,
  executor,
  evaluators: {
    outputQuality: async (output: any, target: any) => {
      if (!target) return 1;
      return llmJudge(output, target);
    },
  },
  config: {
    projectApiKey: process.env.LMNR_PROJECT_API_KEY,
  },
  groupName: "agent-multiturn",
});
