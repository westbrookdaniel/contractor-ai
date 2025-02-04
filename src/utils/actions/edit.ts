import { streamText } from "ai";
import type { History } from "../../types";
import { historyToMessages } from "../conversation";
import { printLine, Color, printStream } from "../io";
import { heavyModel } from "../model";
import { writeToFile } from "../tools/writeToFile";

export async function edit(history: History) {
  printLine("\n* Contractor:", Color.Blue);

  const result = streamText({
    model: heavyModel,
    messages: [
      {
        role: "system",
        content:
          "You are a senior contractor software engineer\n" +
          "Be concise for your written responses, and complete with your code responses.\n" +
          "Don't tell me what the changes were, I can look in the files you write in to see that.",
      },
      ...historyToMessages(history),
    ],
    tools: { writeToFile },
    maxSteps: 5, // max 5 actions
  });

  await printStream(result);

  const response = await result.text;

  if (response.trim() === "") {
    // we need to throw otherise we can infinite loop very easily
    throw new Error("Failed to respond");
  }

  printLine();

  history.push({
    type: "message",
    role: "assistant",
    content: response,
  });
}
