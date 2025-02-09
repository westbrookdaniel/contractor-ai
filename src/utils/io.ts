import type { StreamTextResult, ToolSet } from "ai";

export function clearConsole(): void {
  console.clear();
}

export function clearLines(count: number) {
  process.stdout.moveCursor(0, -count);
  process.stdout.clearScreenDown();
}

export enum Color {
  Red = "\x1b[31m",
  Green = "\x1b[32m",
  Yellow = "\x1b[33m",
  Blue = "\x1b[34m",
  Magenta = "\x1b[35m",
  Cyan = "\x1b[36m",
  White = "\x1b[37m",
  Gray = "\x1b[90m",
  Reset = "\x1b[0m",
}

export function printLine(message: string = "", color?: Color): void {
  const reset = Color.Reset;
  console.log(`${color ?? ""}${message}${reset}`);
}

// ai text nodejs stream, stream into console
// doesnt end with a new line
export async function printStream<T extends ToolSet>(
  stream: StreamTextResult<T, never>,
): Promise<void> {
  for await (const part of stream.fullStream) {
    if (part.type === "text-delta") {
      process.stdout.write(part.textDelta);
    }
    if (part.type === "tool-result") {
      process.stdout.write(
        `\n${
          part.result.success ? Color.Gray : Color.Red
        }${part.result.message}${Color.Reset}\n`,
      );
    }
  }
}

export function printDivider(): void {
  printLine("-".repeat(50), Color.Gray);
}

export function formatPrompt(message: string): string {
  return `\n> ${message}`;
}

export async function requestInput(message: string): Promise<string> {
  const response = await new Promise<string>((resolve) => {
    printLine(formatPrompt(message), Color.Green);
    process.stdin.once("data", (data) => {
      resolve(data.toString().trim());
    });
  });
  return response;
}
