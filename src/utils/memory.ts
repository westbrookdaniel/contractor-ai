import { generateText } from "ai";
import type { History } from "../types";
import { loadMemoryCache, saveMemoryCache } from "./cache";
import { historyToMessages } from "./conversation";
import { model } from "./model";
import { Color, printLine } from "./io";

export async function updateMemory(history: History) {
  const existingMemory = loadMemoryCache();

  const recentMessages = historyToMessages(history);

  const result = await generateText({
    model: model,
    prompt: `
        You are a memory recording system. Your job is to maintain a concise 
        and relevant memory based on a conversation history.

        Here's the existing memory:
        ${existingMemory}
        
        Here's the recent conversation history:
        ${JSON.stringify(recentMessages)}
        
        Analyze the conversation history and the existing memory. Determine if 
        the existing memory needs to be updated to capture any new information 
        or remove anything that is no longer relevant.
        
        Respond with the updated memory. Ensure that the updated memory is concise, 
        relevant, and captures the key aspects of the conversation. If no updates 
        are necessary, simply return the existing memory.

        Also include a summary of important files, or file conventions you
        have observed, or any other information that would help solve problems
        in a large codebase.

        This memory should serve the purpose of providing information about the
        repository and global context that would assist in future actions.

        Do not make the memory goal orientated. The goals of the user will change over time.
    `,
  });

  printLine("Updated Memory", Color.Gray);

  saveMemoryCache(result.text);
}
