import type { Action, History, ManualAction } from "../../types";
import { Color, printLine, requestInput } from "../io";
import { execSync } from "child_process";

const actionHelp: Record<Action | ManualAction, string> = {
  help: "Print out help for all actions",
  clear: "Clear chat history and cache",
  prompt: "Request a prompt from the user",
  addFiles: "File selector to add file contents to history",
  edit: "AI with the capability to edit and create files",
  respond: "AI designed to provide help and converse",
};

export async function prompt(history: History) {
  const stdout = execSync("git status --short").toString();
  if (stdout.trim().length) {
    console.log(
      `\n${Color.Magenta}Pending Changes\n${stdout.trimEnd()}${Color.Reset}`,
    );
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
