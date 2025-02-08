import type { History } from "../../types";
import { Color, formatPrompt, printLine } from "../io";
import fs from "fs";
import { GIT_ROOT, requestFiles } from "../files";

export async function addFiles(history: History) {
  printLine(formatPrompt("Select all relevant files"), Color.Green);

  const filePaths = await requestFiles(GIT_ROOT);

  const fileContents: Record<string, string> = {};
  for (const filePath of filePaths) {
    fileContents[filePath] = fs.readFileSync(filePath, "utf-8");
  }

  history.push(
    {
      type: "data",
      role: "user",
      content: JSON.stringify(fileContents),
    },
    {
      type: "action",
      // a semi sensible default
      action: "prompt",
    },
  );
}
