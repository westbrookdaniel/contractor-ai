import type { History } from "../../types";
import { Color, formatPrompt, printLine } from "../io";
import fs from "fs";
import { determineAction } from "../conversation";
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
      type: "message",
      role: "user", // role "data" ?
      content: JSON.stringify(fileContents),
    },
    {
      type: "action",
      // limit what the follow up actions should be
      action: await determineAction(history, ["edit", "respond"]),
    },
  );
}
