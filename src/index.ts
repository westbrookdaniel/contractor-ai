import { clearConsole, printDivider, printLine } from "./utils/io";
import { execSync } from "child_process";
import { prompt } from "./utils/actions/prompt";
import { determineAction } from "./utils/conversation";
import type { History } from "./types";
import { respond } from "./utils/actions/respond";
import { askForRelevantFiles } from "./utils/actions/askForRelevantFiles";
import { loadHistory, saveHistory } from "./utils/history";
import { edit } from "./utils/actions/edit";

async function main(): Promise<void> {
  clearConsole();
  printLine("\nContractor AI");
  printDivider();
  const history: History = loadHistory();

  // Set up exit handlers to save history
  process.on("SIGINT", () => {
    saveHistory(history);
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    saveHistory(history);
    process.exit(0);
  });

  while (true) {
    const action = await determineAction(history);

    switch (action) {
      case "prompt":
        await prompt(history);
        break;
      case "respond":
        await respond(history);
        break;
      case "edit":
        await edit(history);
        break;
      case "askForRelevantFiles":
        await askForRelevantFiles(history);
        break;
    }

    saveHistory(history);
  }
}

// check we don't have a dirty git before starting
try {
  const gitDiff = execSync("git diff", { encoding: "utf-8" });
  if (gitDiff.length > 0) {
    console.error("Commit or stash your changes before proceeding.");
    process.exit(1);
  }
} catch (error) {
  console.error("Error checking git diff:", error);
  process.exit(1);
}

// run the cli
main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
