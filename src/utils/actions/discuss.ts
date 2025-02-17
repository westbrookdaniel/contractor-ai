import { generateObject, streamObject, streamText } from "ai";
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
        content: `You are a summariser agent in a pipeline. Summarise how the next agent which can perform a number of tool usages
        to interact with the codebase. Very briefly respond. Keep it very short and do not use code. 100 words max.`,
      },
      ...historyToMessages(history),
    ],
  });

  const estimation = generateObject({
    model: model,
    messages: [
      {
        role: "system",
        content: `You are a tool usage estimation agent in a pipeline. Estimate how many tool usages the next ai agent
        will require to complete their task. The tools they have are: writeToFile, readFile, readFilesInDir.
        Choose a number between 0 and 30.`,
      },
      ...historyToMessages(history),
    ],
    schema: z.object({ maxSteps: z.number().min(0).max(20) }),
  });

  await printStream(summary);

  history.push({
    type: "message",
    role: "assistant",
    content: await summary.text,
  });

  const maxStepsEstimate = (await estimation).object.maxSteps;

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
    maxSteps: maxStepsEstimate,
    toolChoice: "required",
  });

  await printStream(actions);

  const actionsText = await actions.text; // this should be "" but just in case

  printLine();

  const summaryHistory = history.pop() as MessageHistory;
  summaryHistory.content += actionsText;
  history.push(summaryHistory);
}
