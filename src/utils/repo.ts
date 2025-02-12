import path from "path";
import { GIT_ROOT } from "./files";
import { model } from "./model";
import { z } from "zod";
import { generateObject } from "ai";
import fs from "fs";
import { loadRepoMap, saveRepoMap } from "./cache";
import ignore from "ignore";

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

let queue: string[] = [];

// absolutePath isn't actually absolute its relative to root
export async function processFile(absolutePath: string) {
  const repoMap = loadRepoMap();
  const filePath = path.relative(GIT_ROOT, absolutePath);

  if (gitignore.ignores(filePath)) {
    return; // Skip the file if it's ignored
  }

  // if was last updated less than an hour ago skip
  const existing = repoMap[filePath];
  if (existing) {
    const lastUpdated = new Date(existing.graphLastUpdated);
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const diffHours = diff / (1000 * 60 * 60);
    if (diffHours < 1) return existing;
  }

  // TODO if in queue should wait for that one and take its result
  if (queue.includes(filePath)) {
    return existing ?? null;
  }
  queue.push(filePath);

  try {
    const summary = await summarizeFile(absolutePath);
    repoMap[filePath] = summary;
    saveRepoMap(repoMap);
    queue = queue.filter((q) => q !== filePath);
    return summary;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }

  queue = queue.filter((q) => q !== filePath);
  return null;
}

function parseGitIgnore() {
  const gitignorePath = path.join(GIT_ROOT, ".gitignore");
  if (!fs.existsSync(gitignorePath)) {
    return { ignores: () => false };
  }
  const gitignoreContents = fs.readFileSync(gitignorePath, "utf-8");
  const ig = ignore();
  ig.add(gitignoreContents);
  return ig;
}

const gitignore = parseGitIgnore();
