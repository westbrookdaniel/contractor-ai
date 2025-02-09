import fs from "fs";
import type { History } from "../../types";
import { HISTORY_FILE, MEMORY_FILE } from "../cache";
import { clearConsole, Color, printLine } from "../io";

export function clear(history: History) {
  fs.existsSync(HISTORY_FILE) && fs.rmSync(HISTORY_FILE);
  fs.existsSync(MEMORY_FILE) && fs.rmSync(MEMORY_FILE);
  history.length = 0;
  clearConsole();
  printLine();
  printLine("History and cache cleared", Color.Gray);
}
