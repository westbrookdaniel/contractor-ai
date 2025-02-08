import type { History } from "../types";
import fs from "fs";
import { join } from "path";
import { homedir } from "os";

const CACHE_FOLDER = join(homedir(), ".config", "contractor-ai");
const DIR_CACHE = join(CACHE_FOLDER, encodeURIComponent(process.cwd()));

if (!fs.existsSync(DIR_CACHE)) {
  fs.mkdirSync(DIR_CACHE, { recursive: true });
}

const HISTORY_FILE = join(CACHE_FOLDER, "history.json");
const MEMORY_FILE = join(CACHE_FOLDER, "memory.txt");

export const loadMemoryCache = () => loadFile(MEMORY_FILE);
export const saveMemoryCache = (c: string) => saveFile(MEMORY_FILE, c);

export function saveHistory(history: History): void {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf8");
  } catch (error) {
    console.error("Error saving history cache:", error);
  }
}

export function loadHistory(): History {
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      const data = fs.readFileSync(HISTORY_FILE, "utf8");
      const oldHistory: History = JSON.parse(data);
      // this helps to prevent infinite loop bugs
      oldHistory.push({ type: "action", action: "prompt" });
      return oldHistory;
    } catch (error) {
      console.error("Error loading history cache:", error);
    }
  }
  return [{ type: "action", action: "prompt" }];
}

export function clearCache() {
  fs.rmSync(DIR_CACHE);
}

function loadFile(file: string) {
  if (fs.existsSync(file)) {
    try {
      return fs.readFileSync(file, "utf8");
    } catch (error) {
      console.error("Error loading file:", error);
    }
  }
  return "";
}

function saveFile(file: string, contents: string): void {
  try {
    fs.writeFileSync(file, contents, "utf8");
  } catch (error) {
    console.error("Error saving file:", error);
  }
}
