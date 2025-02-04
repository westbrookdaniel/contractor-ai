import { streamText } from "ai";
import type { History } from "../../types";
import { historyToMessages } from "../conversation";
import { printLine, Color, printStream, clearLines } from "../io";
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

  // this happens very occasionally, just pretend it doesnt
  if (response.trim() === "") {
    clearLines(2);
    history.push({
      type: "action",
      action: "prompt",
    });
    return;
  }

  printLine();

  history.push({
    type: "message",
    role: "assistant",
    content: response,
  });
}
