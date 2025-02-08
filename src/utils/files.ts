import { clearLines, Color, printLine } from "./io";
import { execSync } from "child_process";
import path from "path";
import readline from "readline";

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

export const GIT_ROOT = findGitRoot(process.cwd());

export async function pickFiles(files: string[], maxLines = 20) {
  let selected = new Set<string>();
  let cursor = 0;
  let offset = 0;

  // Enable raw mode
  const wasRaw = process.stdin.isRaw;
  const wasPaused = process.stdin.isPaused();
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf-8");

  async function listFiles() {
    return files.toSorted();
  }

  function renderList(
    items: Awaited<ReturnType<typeof listFiles>>,
    first?: boolean,
  ) {
    const maxVisibleItems = maxLines - 2; // Account for the two info lines
    const visibleItems = items.slice(offset, offset + maxVisibleItems);

    if (!first) {
      clearLines(maxLines);
    }

    // Move cursor to top of the list area
    readline.cursorTo(process.stdout, 0);

    // Render visible items
    visibleItems.forEach((item, i) => {
      const isSelected = selected.has(path.resolve(GIT_ROOT, item));
      const isCursor = i + offset === cursor;
      const prefix = isCursor ? `${Color.Gray}>${Color.Reset}` : " ";
      const select = isSelected ? `${Color.Green}[x]` : "[ ]";
      const short = path.relative(GIT_ROOT, item);

      printLine(`${prefix} ${select} ${short}${Color.Reset}`);
    });

    // Fill remaining lines with empty space if needed
    for (let i = visibleItems.length; i < maxVisibleItems; i++) {
      printLine("");
    }

    // Render info lines at the bottom
    printLine(
      `Arrow keys to navigate, [space] to select, [enter] to submit`,
      Color.Gray,
    );
    printLine(`${selected.size} selected`, Color.Gray);
  }

  const filePaths = await new Promise<string[]>(async (resolve) => {
    async function handleInput() {
      const items = await listFiles();

      process.stdin.once("data", async (data) => {
        const key = data.toString();

        switch (key) {
          case "\u0003": // Ctrl+C
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.exit(0);

          case " ": // Space
            const fullPath = path.resolve(GIT_ROOT, items[cursor]);
            if (selected.has(fullPath)) {
              selected.delete(fullPath);
            } else {
              selected.add(fullPath);
            }
            renderList(items);
            break;

          case "\u001b[A": // Up arrow
            if (cursor > 0) {
              cursor--;
              if (cursor < offset) {
                offset = cursor;
              }
              renderList(items);
            }
            break;

          case "\u001b[B": // Down arrow
            if (cursor < items.length - 1) {
              cursor++;
              if (cursor >= offset + (maxLines - 2)) {
                offset = cursor - (maxLines - 3);
              }
              renderList(items);
            }
            break;

          case "\r": // Enter
            process.stdin.setRawMode(false);
            process.stdin.pause();
            resolve(Array.from(selected));
            return;
        }

        handleInput();
      });
    }

    const items = await listFiles();
    renderList(items, true);
    handleInput();
  });

  clearLines(maxLines);
  printLine(
    filePaths.length === 0
      ? "No files added"
      : filePaths.map((f) => path.relative(GIT_ROOT, f)).join("\n"),
    Color.Gray,
  );

  process.stdin.setRawMode(wasRaw);
  if (wasPaused) process.stdin.pause();
  else process.stdin.resume();

  return filePaths;
}
