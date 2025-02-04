import { streamText } from "ai";
import type { History } from "../../types";
import { historyToMessages } from "../conversation";
import { printLine, Color, printStream, clearLines } from "../io";
import { heavyModel } from "../model";
import { writeToFile } from "../tools/writeToFile";

export async function edit(history: History) {
  printLine("\n* Contractor:", Color.Blue);

  const result = streamText({
    model: heavyModel,
    messages: historyToMessages(history),
    tools: { writeToFile },
    maxSteps: 5, // max 5 actions
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
