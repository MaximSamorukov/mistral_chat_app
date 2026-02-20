import { useMemo } from "react";
import { ChatMistralAI } from "@langchain/mistralai";

export const useModel = () => {
  const model = useMemo(
    () =>
      new ChatMistralAI({
        apiKey: import.meta.env.VITE_AI_KEY,
        modelName: "open-mistral-7b",
      }),
    [],
  );
  return [model];
};
