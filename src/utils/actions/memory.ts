import type { History } from "../../types";
import { loadMemoryCache } from "../cache";
import { Color, printLine } from "../io";

export function memory(history: History) {
  printLine();
  printLine("Memory:");
  printLine();
  printLine(loadMemoryCache(), Color.Gray);

  history.push({ type: "action", action: "prompt" });
}
