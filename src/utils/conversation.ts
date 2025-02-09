import type { History, MessageHistory } from "../types";
import { Color, printLine } from "./io";

// configurable? probably adjust this based on pricing and usage
const MAX_MESSAGES = 10;
const MAX_DATA = 5;

export function historyToData(history: History) {
  return JSON.stringify(history.slice(-MAX_DATA));
}

export function historyToMessages(history: History, count = MAX_MESSAGES) {
  const filtered = history
    .filter((h) => h.type === "message" || h.type === "data")
    .slice(-count) as MessageHistory[];

  return filtered.map((m) => ({ role: m.role, content: m.content }));
}

export function condenseHistory(history: History) {
  const next = history.filter((h) => h.type !== "data");
  if (next.length !== history.length) {
    printLine("\nConensing history by removing added files", Color.Gray);
    history.splice(0, history.length, ...next);
  }
}
