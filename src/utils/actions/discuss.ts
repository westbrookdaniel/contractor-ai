import { streamText } from "ai";
import type { History } from "../../types";
import { historyToMessages } from "../conversation";
import { printLine, Color, printStream } from "../io";
import { model } from "../model";
import { loadMemoryCache } from "../cache";
import { readFile } from "../tools/readFile";
import { readFilesInDir } from "../tools/readFilesInDir";

export async function discuss(history: History, changedFiles: Set<string>) {
  printLine("\n* Contractor:", Color.Blue);

  const result = streamText({
    model: model,
    messages: [
      {
        role: "system",
        content: `
          You are a reasoning model. Your purpose is to think step by step.
          Now, think step by step for the following question. Only output your reasoning.
          Be thorough and consider the users intentions and all possible outcomes.
          Interject with wait if you think you may have come across a useful thought.

          Be helpful. Ask a follow up question.
          The user has the ability to apply edits when they decide they are ready.

          Here is some context about about this repository:
          ${loadMemoryCache()}

          Here are some files that have been modified recently:
          ${[...changedFiles].slice(-10).join("\n")}

          If you want to look for more files use the readFilesInDir tool to discover
          more parts of the repository, including other directories to traverse or files
          to read. You are a part of an existing repository so if the user is refering to things
          you aren't sure about try and look for them in existing relevant files, or
          ask the user for more information about where to find them.
        `,
      },
      ...historyToMessages(history),
    ],
    tools: { readFile, readFilesInDir },
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
