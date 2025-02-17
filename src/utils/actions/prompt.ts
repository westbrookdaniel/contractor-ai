import type { History, Action } from "../../types";
import { Color, printLine, requestInput } from "../io";
import { execSync } from "child_process";

const withMessage: Action[] = ["discuss"];

const actionHelp: Record<Action, string> = {
  help: "Print out help for all actions",
  clear: "Clear chat history and cache",
  prompt: "Request a prompt from the user",
  addFiles: "File selector to add file contents to history",
  memory: "Print out the cached memory contents",
  discuss: "AI designed to provide help and converse (default)",
};

export async function prompt(history: History) {
  const stdout = execSync("git status --short").toString();
  if (stdout.trim().length) {
    console.log(
      `\n${Color.Magenta}Pending Changes\n${stdout.trimEnd()}${Color.Reset}`,
    );
  }

  const response = await requestInput("Discuss (or / for actions)");

  if (response.startsWith("/")) {
    // help action
    if (response === "/help") {
      printLine();
      for (const action in actionHelp) {
        printLine(`/${action} - ${(actionHelp as any)[action]}`, Color.Gray);
      }
      history.push({ type: "action", action: "prompt" });
      return;
    }

    const action = response.substring(1).trim();

    // normal exact match actions
    if (action in actionHelp) {
      history.push({ type: "action", action: action as Action });
      return;
    }

    // actions which can have a message
    for (const key of withMessage) {
      if (action.startsWith(key)) {
        const content = action.substring(key.length).trim();
        history.push({ type: "message", role: "user", content });
        history.push({ type: "action", action: key });
        return;
      }
    }

    printLine("Unknown Action\n", Color.Red);
    for (const action in actionHelp) {
      printLine(`/${action} - ${(actionHelp as any)[action]}`, Color.Gray);
    }
    history.push({ type: "action", action: "prompt" });
  } else {
    // just a normal prompt
    history.push({
      type: "message",
      role: "user",
      content: response,
    });
  }
}
