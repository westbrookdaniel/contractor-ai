import { streamText } from "ai";
import type { History } from "../../types";
import { historyToMessages } from "../conversation";
import { printLine, Color, printStream } from "../io";
import { model } from "../model";
import { writeToFile } from "../tools/writeToFile";
import { loadMemoryCache } from "../cache";
import { readFile } from "../tools/readFile";

export async function edit(history: History, changedFiles: Set<string>) {
  printLine("\n* Contractor:", Color.Blue);

  const result = streamText({
    model: model,
    messages: [
      {
        role: "system",
        content: `
          You are a senior contractor software engineer.
          Be concise for your written responses, and complete with your code responses.
          Don't tell me what the changes were, I can look in the files you write in to see that.

          Before writing to a file, always read its current content using the readFile tool 
          to understand the existing context and avoid overwriting important information.
          
          Here is some context about about this repository:
          ${loadMemoryCache()}

          Here are files the user has changed recently:
          ${[...changedFiles].slice(-10).join("\n")}
        `,
      },
      ...historyToMessages(history),
    ],
    tools: { writeToFile, readFile },
    maxSteps: 10,
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
