import { streamText } from "ai";
import type { History } from "../../types";
import { historyToMessages } from "../conversation";
import { printLine, Color, printStream } from "../io";
import { heavyModel } from "../model";

export async function respond(history: History) {
  printLine("\n* Contractor:", Color.Blue);

  const result = streamText({
    model: heavyModel,
    messages: [
      {
        role: "system",
        content:
          "You are a senior contractor software engineer\n" +
          "Be concise for your written responses, and complete with your code responses.\n" +
          "Be helpful. Ask a follow up question.",
      },
      ...historyToMessages(history),
    ],
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
