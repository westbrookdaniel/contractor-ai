import { streamText } from "ai";
import type { History } from "../../types";
import { historyToMessages } from "../conversation";
import { printLine, Color, printStream } from "../io";
import { model } from "../model";
import { loadMemoryCache } from "../cache";
import { readFile } from "../tools/readFile";
import { writeToFile } from "../tools/writeToFile";
import { readFilesInDir } from "../tools/readFilesInDir";

export async function discuss(history: History, changedFiles: Set<string>) {
  printLine("\n* Contractor:", Color.Blue);

  const summary = streamText({
    model: model,
    messages: [
      {
        role: "system",
        content: `Very briefly respond. Keep it very short and do not use code. 200 words max.`,
      },
      ...historyToMessages(history),
    ],
    tools: { writeToFile, readFile, readFilesInDir },
    maxSteps: 20,
    toolChoice: "required",
  });

  await printStream(summary);

  const actions = streamText({
    model: model,
    messages: [
      {
        role: "system",
        content: `
          You are a reasoning model. Your purpose is to think step by step.
          Now, think step by step for the following question.
          Be thorough and consider the users intentions and all possible outcomes.
          Interject with wait if you think you may have come across a useful thought.

          You have the experience of a senior contractor software engineer.
          Be concise for your written responses, and complete with your code responses. Conform to the codebase.

          Before writing to a file, always read its current content using the readFile tool 
          to understand the existing context and avoid overwriting important information.

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
    tools: { writeToFile, readFile, readFilesInDir },
    maxSteps: 20,
    toolChoice: "required",
  });

  await printStream(actions);

  const summaryText = await summary.text;
  const actionsText = await actions.text; // this should be "" but just in case
  const response = summaryText + actionsText;

  printLine();

  if (response.trim() === "") {
    history.push({
      type: "message",
      role: "assistant",
      content:
        "<thought>I completed the task but there was was no further communication required</thought>",
    });
  } else {
    history.push({
      type: "message",
      role: "assistant",
      content: response,
    });
  }
}
