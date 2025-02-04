import type { History } from "../types";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { printLine } from "./io";

const HISTORY_FOLDER = join(tmpdir(), "contractor-ai");

if (!existsSync(HISTORY_FOLDER)) {
  mkdirSync(HISTORY_FOLDER, { recursive: true });
}

const HISTORY_CACHE_FILE = join(
  HISTORY_FOLDER,
  `history-cache-${encodeURIComponent(process.cwd())}.json`,
);

export function loadHistory(): History {
  if (existsSync(HISTORY_CACHE_FILE)) {
    try {
      const data = readFileSync(HISTORY_CACHE_FILE, "utf8");
      printLine(`Loaded history from ${HISTORY_CACHE_FILE}`);
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading history cache:", error);
    }
  }

  printLine("Hello. How can I help?");

  // Return default history if no cache exists or on error
  return [
    {
      type: "message",
      role: "system",
      content:
        "You are a senior contractor software engineer\n" +
        // Helps stop rambling
        "Be concise for your written responses, and complete with your code responses.\n" +
        // This is needed otherwise will say something like "I'm equipt with file writing operations"
        "If the user is trying to convers with you, be personable and respond.",
    },
    {
      type: "action",
      action: "prompt",
    },
  ];
}

export function saveHistory(history: History): void {
  try {
    writeFileSync(HISTORY_CACHE_FILE, JSON.stringify(history, null, 2), "utf8");
  } catch (error) {
    console.error("Error saving history cache:", error);
  }
}
