import { streamText } from "ai";
import type { History } from "../../types";
import { historyToMessages } from "../conversation";
import { printLine, Color, printStream } from "../io";
import { model } from "../model";
import { writeToFile } from "../tools/writeToFile";
import { loadMemoryCache } from "../cache";

export async function edit(history: History) {
  printLine("\n* Contractor:", Color.Blue);

  const result = streamText({
    model: model,
    messages: [
      {
        role: "system",
        content:
          "You are a senior contractor software engineer\n" +
          "Be concise for your written responses, and complete with your code responses.\n" +
          "Don't tell me what the changes were, I can look in the files you write in to see that.\n" +
          "\n" +
          "Here is some context about about this repository:\n" +
          loadMemoryCache(),
      },
      ...historyToMessages(history),
    ],
    tools: { writeToFile },
    maxSteps: 5, // max 5 actions
  });

  await printStream(result);

  const response = await result.text;

  if (response.trim() === "") {
    // we need to exit otherise we can infinite loop very easily
    printLine("Failed to respond", Color.Red);
    process.exit(1);
  }

  printLine();

  history.push({
    type: "message",
    role: "assistant",
    content: response,
  });
}
