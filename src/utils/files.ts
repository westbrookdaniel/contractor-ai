import { clearLines, Color, printLine } from "./io";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
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

export async function requestFiles(startPath = ".", maxLines = 20) {
  let currentPath = path.resolve(startPath);
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
    try {
      const items = fs.readdirSync(currentPath, { withFileTypes: true });
      return [
        { name: "..", isDirectory: () => true },
        ...items.sort((a, b) => {
          if (a.isDirectory() === b.isDirectory())
            return a.name.localeCompare(b.name);
          return b.isDirectory() ? 1 : -1;
        }),
      ];
    } catch (error) {
      return [{ name: "..", isDirectory: () => true }];
    }
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
      const isSelected = selected.has(path.resolve(currentPath, item.name));
      const isCursor = i + offset === cursor;
      const prefix = isCursor ? `${Color.Gray}>${Color.Reset}` : " ";
      const select = isSelected
        ? `${Color.Green}[x]`
        : item.isDirectory()
          ? "   "
          : "[ ]";
      const suffix = item.isDirectory() ? "/" : "";

      printLine(`${prefix} ${select} ${item.name}${suffix}${Color.Reset}`);
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
    printLine(
      `${selected.size} selected. Dir: ${path.relative(process.cwd(), currentPath)}/`,
      Color.Gray,
    );
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
            if (items[cursor].isDirectory()) {
              currentPath = path.resolve(currentPath, items[cursor].name);
              cursor = 0;
              offset = 0;
              renderList(await listFiles());
            } else {
              const fullPath = path.resolve(currentPath, items[cursor].name);
              if (selected.has(fullPath)) {
                selected.delete(fullPath);
              } else {
                selected.add(fullPath);
              }
              renderList(items);
            }
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
    filePaths.map((f) => path.relative(startPath, f)).join("\n"),
    Color.Gray,
  );

  process.stdin.setRawMode(wasRaw);
  if (wasPaused) process.stdin.pause();
  else process.stdin.resume();

  return filePaths;
}
