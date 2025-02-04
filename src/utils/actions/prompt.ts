import type { Action, History, ManualAction } from "../../types";
import { requestInput } from "../io";

const allActions: Record<Action | ManualAction, string> = {};

export async function prompt(history: History) {
  const response = await requestInput("Prompt");

  history.push({
    type: "message",
    role: "user",
    content: response,
  });

  if (response.startsWith("/")) {
    for (const action in allActions) {
      console.log(action);
    }
  }
}
