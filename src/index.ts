import { clearConsole, printDivider, printLine } from "./utils/io";
import { prompt } from "./utils/actions/prompt";
import { discuss } from "./utils/actions/discuss";
import { addFiles } from "./utils/actions/addFiles";
import { loadHistory, saveHistory } from "./utils/cache";
import { clear } from "./utils/actions/clear";
import { memory } from "./utils/actions/memory";
import { determineAction } from "./utils/determine";

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
    const action = determineAction(history);

    switch (action) {
      case "prompt":
        await prompt(history);
        break;
      case "discuss":
        await discuss(history);
        break;
      case "clear":
        await clear(history);
        break;
      case "memory":
        memory(history);
        break;
      case "addFiles":
        await addFiles(history);
        break;
    }

    await saveHistory(history, {
      updateMemory: action === "discuss",
      // condense: true, not used anymore
    });
  }
}

// run the cli
main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
