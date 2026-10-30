import type {
  MultiTurnEvalData,
  MultiTurnDatasetEntry,
  MultiTurnResult,
  MultiTurnTarget,
} from "./types";
import { evaluate } from "@lmnr-ai/lmnr";
import { toolOrderCorrect, toolsAvoided, llmJudge } from "./evaluators";

import dataset from "./data/agent-multiturn.json" with { type: "json" };
import { mutliTurnWithMocks } from "./executors";

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
    projectApiKey: process.env.LMR_API_KEY,
  },
  groupName: "agent-multiturn",
});
