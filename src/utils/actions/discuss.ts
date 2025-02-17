import { generateObject, streamText } from "ai";
import type { History, MessageHistory } from "../../types";
import { historyToMessages } from "../conversation";
import { printLine, Color, printStream } from "../io";
import { model } from "../model";
import { loadMemoryCache } from "../cache";
import { readFile } from "../tools/readFile";
import { writeToFile } from "../tools/writeToFile";
import { readFilesInDir } from "../tools/readFilesInDir";
import { z } from "zod";

export async function discuss(history: History, changedFiles: Set<string>) {
  printLine("\n* Contractor:", Color.Blue);

  const summary = streamText({
    model: model,
    messages: [
      {
        role: "system",
        content: `
          Think step by step for the following question.

          ${loadMemoryCache()}

          Here are some files that have been modified recently:
          ${[...changedFiles].slice(-10).join("\n")}

          You have the experience of a senior contractor software engineer.
          Be concise for your written responses, do not include any tools.
          Another follow up AI agent will read and write files to complete the task for you.
        `,
      },
      ...historyToMessages(history),
    ],
  });

  await printStream(summary);

  history.push({
    type: "message",
    role: "assistant",
    content: await summary.text,
  });

  printLine(); // lil spacer

  const actions = streamText({
    model: model,
    messages: [
      {
        role: "system",
        content: `
          Perform the task by thinking step by step make the code changes.

          You have the experience of a senior contractor software engineer.
          Be concise for your written responses, and complete with your code responses.
          Conform to the existing codebase.

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

  const actionsText = await actions.text; // this should be "" but just in case

  printLine();

  const summaryHistory = history.pop() as MessageHistory;
  summaryHistory.content += actionsText;
  history.push(summaryHistory);
}
