import { execSync } from "child_process";
import path from "path";
import { pickValues } from "./actions/pickValues";
import { Color, printLine } from "./io";

export function findGitRoot(initialPath: string): string {
  try {
    const stdout = execSync("git rev-parse --show-toplevel", {
      cwd: initialPath,
    });
    return stdout.toString().trim();
  } catch (error) {
    throw new Error("Not a git repository or git command failed");
  }
}

// TODO CWD HERE IS WRONG
export const GIT_ROOT = findGitRoot(process.cwd());

export async function pickFiles(files: string[], maxLines = 20) {
  const selectedFiles = await pickValues(
    files,
    (file) => path.relative(GIT_ROOT, file),
    maxLines,
  );
  printLine(
    selectedFiles.length === 0
      ? "No files added"
      : selectedFiles.map((f) => path.relative(GIT_ROOT, f)).join("\n"),
    Color.Gray,
  );
  return selectedFiles;
}
