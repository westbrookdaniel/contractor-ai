import { generateObject } from "ai";
import type { Action, History, MessageHistory } from "../types";
import { clearLines, Color, printLine } from "./io";
import { heavyModel } from "./model";
import { z } from "zod";

const ACTION_PROMPTS: Record<Action, string> = {
  respond: "Provide assistance, converse, and request more context",
  edit: "Edit or create files if the request is clear and actionable",
  addFiles: "Request the user to select relevant files",
  prompt: "Ask the user to respond",
};

export async function determineAction(
  history: History,
  allowedActions: Action[],
): Promise<Action> {
  const last = history[history.length - 1];
  if (last.type === "action") {
    return last.action;
  }

  // If ai just sent a message force the next to be prompt,
  // ai isn't great at picking when to ask for a prompt
  if (last.type === "message" && last.role === "assistant") {
    history.push({ type: "action", action: "prompt" });
    return "prompt";
  }

  printLine("\n* Determining Action...", Color.Gray);

  const actionSchema = z.enum(allowedActions as [Action, ...Action[]]);

  const response = await generateObject({
    model: heavyModel,
    messages: [
      {
        role: "system",
        content:
          "Analyze the last message in the conversation and determine the next action.\n" +
          "\n" +
          "Available Actions:\n" +
          allowedActions
            .map(
              (action, i) =>
                `${i + 1}. '${action}' ${ACTION_PROMPTS[action]}\n`,
            )
            .join("") +
          "\n" +
          "Rules:\n" +
          "- Return single action without commentary\n" +
          "- Actions are case-sensitive\n" +
          "- Consider full conversation context\n" +
          "- Respond immediately when clear direction exists\n",
      },
      {
        role: "user",
        content: historyToData(history),
      },
    ],
    schema: z.object({
      action: actionSchema,
    }),
  });

  clearLines(2);

  const action = response.object.action;
  history.push({ type: "action", action });
  return action;
}

// configurable? probably adjust this based on pricing and usage
const MAX_MESSAGES = 10;
const MAX_DATA = 5;

export function historyToData(history: History) {
  return JSON.stringify(history.slice(-MAX_DATA));
}

export function historyToMessages(
  history: History,
  opts?: { withoutSystem?: boolean },
) {
  const withoutSystem = opts?.withoutSystem ?? false;

  const filtered = history
    .slice(-MAX_MESSAGES)
    .filter((h) =>
      withoutSystem
        ? h.type === "message"
        : h.type === "message" && h.role !== "system",
    ) as MessageHistory[];

  return filtered.map((m) => ({ role: m.role, content: m.content }));
}
