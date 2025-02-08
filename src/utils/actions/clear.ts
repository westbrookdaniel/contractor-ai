import type { History } from "../../types";
import { clearCache } from "../cache";
import { clearConsole, Color, printLine } from "../io";

export function clear(history: History) {
  clearCache();
  history.length = 0;
  clearConsole();
  printLine();
  printLine("Cleared History", Color.Gray);
}
