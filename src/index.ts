import { clearConsole, printDivider, printLine } from "./utils/io";
import { prompt } from "./utils/actions/prompt";
import { determineAction } from "./utils/conversation";
import type { Action } from "./types";
import { respond } from "./utils/actions/respond";
import { addFiles } from "./utils/actions/addFiles";
import { loadHistory, saveHistory } from "./utils/cache";
import { edit } from "./utils/actions/edit";
import { clear } from "./utils/actions/clear";
import { updateMemory } from "./utils/memory";

// all actions ai can determine to run automatically
// dont want to include 'prompt', its not great at that
const AVAILABLE_AI_ACTIONS: Action[] = ["respond", "edit", "addFiles"];

async function main(): Promise<void> {
  clearConsole();
  printLine("\nContractor AI");
  printDivider();
  printLine("Hello. How can I help?");

  const history = loadHistory();

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
    const action = await determineAction(history, AVAILABLE_AI_ACTIONS);

    switch (action) {
      case "prompt":
        await prompt(history);
        break;
      case "respond":
        await respond(history);
        await saveHistory(history);
        break;
      case "edit":
        await edit(history);
        break;
      case "clear":
        clear(history);
        break;
      case "addFiles":
        await addFiles(history);
        break;
    }
  }
}

// run the cli
main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
