import type { History } from "../../types";
import { Color, formatPrompt, printLine } from "../io";
import fs from "fs";
import { pickFiles } from "../files";

export async function addFiles(history: History, changedFiles: Set<string>) {
  if (!changedFiles.size) {
    printLine("\nNo recently changed files", Color.Gray);
    history.push({ type: "action", action: "prompt" });
    return;
  }

  printLine(
    formatPrompt("Select recently changed files to add to context"),
    Color.Green,
  );

  const filePaths = await pickFiles([...changedFiles]);

  const fileContents: Record<string, string> = {};
  for (const filePath of filePaths) {
    fileContents[filePath] = fs.readFileSync(filePath, "utf-8");
  }

  history.push(
    { type: "data", role: "user", content: JSON.stringify(fileContents) },
    { type: "action", action: "prompt" },
  );
}
