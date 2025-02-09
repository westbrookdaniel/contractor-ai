import { clearConsole, printDivider, printLine } from "./utils/io";
import { prompt } from "./utils/actions/prompt";
import { discuss } from "./utils/actions/discuss";
import { addFiles } from "./utils/actions/addFiles";
import { loadHistory, saveHistory } from "./utils/cache";
import { edit } from "./utils/actions/edit";
import { clear } from "./utils/actions/clear";
import { memory } from "./utils/actions/memory";
import { startFileWatcher } from "./utils/watcher";
import { determineAction } from "./utils/determine";

async function main(): Promise<void> {
  clearConsole();
  printLine("\nContractor AI");
  printDivider();
  printLine("Hello. How can I help?");

  const history = loadHistory();

  const changedFiles = startFileWatcher();

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
    const action = determineAction(history);

    switch (action) {
      case "prompt":
        await prompt(history);
        break;
      case "discuss":
        await discuss(history, changedFiles);
        break;
      case "edit":
        await edit(history, changedFiles);
        break;
      case "clear":
        clear(history);
        break;
      case "memory":
        memory(history);
        break;
      case "addFiles":
        await addFiles(history, changedFiles);
        break;
    }

    await saveHistory(history, { condense: action === "edit" });
  }
}

// run the cli
main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
