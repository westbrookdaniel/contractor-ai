import { streamText } from "ai";
import type { History } from "../../types";
import { historyToMessages } from "../conversation";
import { printLine, Color, printStream } from "../io";
import { model } from "../model";
import { loadMemoryCache } from "../cache";

export async function respond(history: History) {
  printLine("\n* Contractor:", Color.Blue);

  const result = streamText({
    model: model,
    messages: [
      {
        role: "system",
        content:
          "You are a senior contractor software engineer\n" +
          "Be concise for your written responses, and complete with your code responses.\n" +
          "Be helpful. Ask a follow up question.\n" +
          "\n" +
          "Here is some context about about this repository:\n" +
          loadMemoryCache(),
      },
      ...historyToMessages(history),
    ],
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
