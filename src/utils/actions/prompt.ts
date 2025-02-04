import { streamText } from "ai";
import type { Action, History, ManualAction } from "../../types";
import {
  Color,
  formatPrompt,
  printLine,
  printStream,
  requestInput,
} from "../io";
import { execSync } from "child_process";
import { heavyModel } from "../model";
import { historyToMessages } from "../conversation";

let AUTO_GOAL = "";

const actionHelp: Record<Action | ManualAction, string> = {
  help: "Print out help for all actions",
  clear: "Clear chat history and cache",
  prompt: "Request a prompt from the user",
  addFiles: "File selector to add file contents to history",
  edit: "AI with the capability to edit and create files",
  respond: "AI designed to provide help and converse",
  auto: "Run automatically until exit to achieve provided goal: /auto [goal]",
};

export async function prompt(history: History) {
  const stdout = execSync("git status --short").toString();
  if (stdout.trim().length) {
    console.log(
      `\n${Color.Magenta}Pending Changes\n${stdout.trimEnd()}${Color.Reset}`,
    );
  }

  if (AUTO_GOAL) {
    printLine(formatPrompt("Prompt (AUTO)"), Color.Green);

    const result = streamText({
      model: heavyModel,
      messages: [
        {
          role: "system",
          content:
            "You are a senior software engineer.\n" +
            "You are working with another software engineer to complete the task of:" +
            `"${AUTO_GOAL}"` +
            "\n" +
            "Be very concise and ask for the engineer to perform an\n" +
            "action that works towards or completes the greater goal.",
        },
        ...historyToMessages(history, 5),
      ],
    });

    await printStream(result);

    history.push({
      type: "message",
      role: "user",
      content: await result.text,
    });
    return;
  }

  const response = await requestInput("Prompt");

  history.push({
    type: "message",
    role: "user",
    content: response,
  });

  // manual actions
  if (response.startsWith("/")) {
    if (response === "/help") {
      printLine();
      for (const action in actionHelp) {
        printLine(`/${action} - ${(actionHelp as any)[action]}`, Color.Gray);
      }
      history.push({ type: "action", action: "prompt" });
      return;
    }

    if (response.startsWith("/auto")) {
      const goal = response.substring("/auto ".length).trim();
      if (!goal) {
        printLine("A goal is required. /auto [goal]\n", Color.Red);
      } else {
        AUTO_GOAL = goal;
      }

      history.push({ type: "action", action: "prompt" });
      return;
    }

    const action = response.substring(1) as any;
    if (action in actionHelp) {
      history.push({ type: "action", action });
      return;
    }

    printLine("Unknown Action\n", Color.Red);
    for (const action in actionHelp) {
      printLine(`/${action} - ${(actionHelp as any)[action]}`, Color.Gray);
    }
    history.push({ type: "action", action: "prompt" });
  }
}
