import path from "path";
import { GIT_ROOT } from "./files";
import { model } from "./model";
import { z } from "zod";
import { generateObject } from "ai";
import fs from "fs";
import { loadRepoMap, saveRepoMap } from "./cache";
import { Color, printLine } from "./io";

export type RepoMapSummary = {
  imports: string[];
  exports: string[];
  summary: string;
  graphLastUpdated: string; // ISO timestamp
};

async function summarizeFile(filePath: string): Promise<RepoMapSummary> {
  const content = fs.readFileSync(filePath, "utf-8");

  const result = await generateObject({
    model: model,
    prompt: `
      Summarize the API of this file. Include a list of the 
      file paths for all the imports and exports of this file.
      Focus on key functions, classes, and overall purpose:
      ${content}
    `,
    schema: z.object({
      imports: z.array(z.string()),
      exports: z.array(z.string()),
      summary: z.string(),
    }),
  });

  return {
    ...result.object,
    graphLastUpdated: new Date().toISOString(),
  };
}

export async function processFile(absolutePath: string) {
  const repoMap = loadRepoMap();
  const filePath = path.relative(GIT_ROOT, absolutePath);

  // if was last updated less than an hour ago skip
  const existing = repoMap[filePath];
  if (!existing) return;
  const lastUpdated = new Date(existing.graphLastUpdated);
  const now = new Date();
  const diff = now.getTime() - lastUpdated.getTime();
  const diffHours = diff / (1000 * 60 * 60);
  if (diffHours < 1) return;

  try {
    const summary = await summarizeFile(absolutePath);
    repoMap[filePath] = summary;
    saveRepoMap(repoMap);
    printLine(`Reprocessed ${filePath}`, Color.Gray);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}
