import type { History } from "../types";
import fs from "fs";
import { join } from "path";
import { homedir } from "os";
import { printLine } from "./io";

const HISTORY_FOLDER = join(homedir(), ".config", "contractor-ai");

if (!fs.existsSync(HISTORY_FOLDER)) {
  fs.mkdirSync(HISTORY_FOLDER, { recursive: true });
}

export const HISTORY_CACHE_FILE = join(
  HISTORY_FOLDER,
  `history-cache-${encodeURIComponent(process.cwd())}.json`,
);

export function loadHistory(): History {
  if (fs.existsSync(HISTORY_CACHE_FILE)) {
    try {
      const data = fs.readFileSync(HISTORY_CACHE_FILE, "utf8");
      printLine(`Loaded history from cache`);
      const oldHistory: History = JSON.parse(data);
      // this helps to prevent infinite loop bugs
      oldHistory.push({ type: "action", action: "prompt" });
      return oldHistory;
    } catch (error) {
      console.error("Error loading history cache:", error);
    }
  }
  printLine("Hello. How can I help?");
  return [
    {
      type: "action",
      action: "prompt",
    },
  ];
}

export function saveHistory(history: History): void {
  try {
    fs.writeFileSync(
      HISTORY_CACHE_FILE,
      JSON.stringify(history, null, 2),
      "utf8",
    );
  } catch (error) {
    console.error("Error saving history cache:", error);
  }
}
