import type { History } from "../../types";
import { HISTORY_CACHE_FILE } from "../history";
import fs from "fs";
import { Color, printLine } from "../io";

export function clear(history: History) {
  fs.rmSync(HISTORY_CACHE_FILE);
  history.length = 0;
  printLine();
  printLine("Cleared History", Color.Gray);
}
