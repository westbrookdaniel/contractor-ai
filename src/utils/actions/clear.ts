import fs from "fs";
import type { History } from "../../types";
import { HISTORY_FILE, MEMORY_FILE, REPO_FILE } from "../cache";
import { clearConsole, Color, formatPrompt, printLine } from "../io";
import { pickValues } from "../pickValues";

async function pickClearingMethods(maxLines = 7) {
  const selected = await pickValues(
    ["History", "Memory", "Repository Cache", "Console"],
    (n) => "Clear " + n,
    maxLines,
  );
  return selected;
}

export async function clear(history: History) {
  printLine(formatPrompt("Select what you would like to clear"), Color.Green);

  const selected = await pickClearingMethods();

  if (selected.includes("History")) {
    fs.existsSync(HISTORY_FILE) && fs.rmSync(HISTORY_FILE);
    history.length = 0;
  }
  if (selected.includes("Memory")) {
    fs.existsSync(MEMORY_FILE) && fs.rmSync(MEMORY_FILE);
  }
  if (selected.includes("Repository Cache")) {
    fs.existsSync(REPO_FILE) && fs.rmSync(REPO_FILE);
  }
  if (selected.includes("Console")) {
    clearConsole();
  }

  printLine();
  printLine(
    selected.length === 0
      ? "Nothing to clear"
      : "Cleared " + selected.join(", "),
    Color.Gray,
  );

  history.push({ type: "action", action: "prompt" });
}
