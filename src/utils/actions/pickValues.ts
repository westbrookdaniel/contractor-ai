import { clearLines, Color, printLine } from "../io";
import readline from "readline";

export async function pickValues<T>(
  values: T[],
  getLabel: (value: T) => string,
  maxLines: number = 20,
): Promise<T[]> {
  let selected = new Set<T>();
  let cursor = 0;
  let offset = 0;

  // Enable raw mode
  const wasRaw = process.stdin.isRaw;
  const wasPaused = process.stdin.isPaused();
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf-8");

  async function listValues() {
    return values.toSorted((a, b) => getLabel(a).localeCompare(getLabel(b)));
  }

  function renderList(
    items: Awaited<ReturnType<typeof listValues>>,
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
      const isSelected = selected.has(item);
      const isCursor = i + offset === cursor;
      const prefix = isCursor ? `${Color.Gray}>${Color.Reset}` : " ";
      const select = isSelected ? `${Color.Green}[x]` : "[ ]";
      const label = getLabel(item);

      printLine(`${prefix} ${select} ${label}${Color.Reset}`);
    });

    // Fill remaining lines with empty space if needed
    for (let i = visibleItems.length; i < maxVisibleItems; i++) {
      printLine("");
    }

    // Render info lines at the bottom
    printLine(
      `Arrows to navigate, [space] to select, [enter] to submit, [esc] to cancel`,
      Color.Gray,
    );
    printLine(`${selected.size} selected`, Color.Gray);
  }

  const selectedValues = await new Promise<T[]>(async (resolve) => {
    async function handleInput() {
      const items = await listValues();

      process.stdin.once("data", async (data) => {
        const key = data.toString();

        switch (key) {
          case "\u0003": // Ctrl+C
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.exit(0);

          case " ": // Space
            const item = items[cursor];
            if (selected.has(item)) {
              selected.delete(item);
            } else {
              selected.add(item);
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

          case "\u001b": // Escape
            process.stdin.setRawMode(false);
            process.stdin.pause();
            resolve([]);
            return;

          case "\r": // Enter
            process.stdin.setRawMode(false);
            process.stdin.pause();
            resolve(Array.from(selected));
            return;
        }

        handleInput();
      });
    }

    const items = await listValues();
    renderList(items, true);
    handleInput();
  });

  clearLines(maxLines);

  process.stdin.setRawMode(wasRaw);
  if (wasPaused) process.stdin.pause();
  else process.stdin.resume();

  return selectedValues;
}
