import type { History, Action } from "../types";

export function determineAction(history: History): Action {
  const last = history[history.length - 1];

  // This is probably because we just cleared the history
  if (!last) {
    history.push({ type: "action", action: "prompt" });
    return "prompt";
  }

  // We have an action next then we'll use that
  if (last.type === "action") {
    return last.action;
  }

  // If ai just sent a message then the next will be prompt
  if (last.type === "message" && last.role === "assistant") {
    history.push({ type: "action", action: "prompt" });
    return "prompt";
  }

  // Otherwise the default ai response
  history.push({ type: "action", action: "discuss" });
  return "discuss";
}
