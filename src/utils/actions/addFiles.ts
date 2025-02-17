import type { History } from "../../types";
import { Color, formatPrompt, printLine, requestInput } from "../io";
import fs from "fs";
import { pickValues } from "../pickValues";
import { execSync } from "child_process";
import path from "path";
import { GIT_ROOT } from "../files";

async function getGitFiles(): Promise<string[]> {
  try {
    const stdout = execSync("git ls-files", { cwd: GIT_ROOT });
    return stdout.toString().trim().split("\n");
  } catch (error) {
    console.error("Error listing git files:", error);
    return [];
  }
}

export async function addFiles(history: History) {
  const gitFiles = await getGitFiles();

  const searchTerm = await requestInput(
    "Enter a search term to find files (or press Enter to show all files):",
  );

  const filteredFiles = gitFiles.filter((file) =>
    searchTerm ? file.includes(searchTerm) : true,
  );

  if (!filteredFiles.length) {
    printLine("No files found.", Color.Gray);
    history.push({ type: "action", action: "prompt" });
    return;
  }

  printLine(formatPrompt("Select files to add to context"), Color.Green);

  const filePaths = await pickValues(filteredFiles, (file) =>
    path.relative(GIT_ROOT, file),
  );

  const fileContents: Record<string, string> = {};
  for (const filePath of filePaths) {
    fileContents[filePath] = fs.readFileSync(
      path.join(GIT_ROOT, filePath),
      "utf-8",
    );
  }

  history.push(
    { type: "data", role: "user", content: JSON.stringify(fileContents) },
    { type: "action", action: "prompt" },
  );
}
