import { tool } from "ai";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { GIT_ROOT } from "../files";
import { loadRepoMap } from "../cache";
import { safelyNormalizePath } from "../safety";
import { processFile, type RepoMapSummary } from "../repo";
import { Color, printLine } from "../io";

export const readFilesInDir = tool({
  description: "Get a summary for all the files in a directory",
  parameters: z.object({
    directoryName: z.string().describe("Name of the directory to read"),
  }),
  execute: async ({ directoryName: unsafe }) => {
    const directoryName = safelyNormalizePath(unsafe);
    try {
      const repoMap = loadRepoMap();
      const fileNames = await fs.promises.readdir(directoryName, "utf-8");

      printLine(
        `Searching ${path.relative(GIT_ROOT, directoryName)}`,
        Color.Gray,
      );

      const graphInfoMap: Record<
        string,
        { summary: RepoMapSummary | null; isDir: boolean }
      > = {};
      for (const unsafeFile of fileNames) {
        const fileName = safelyNormalizePath(
          path.join(directoryName, unsafeFile),
        );

        if (fs.statSync(fileName).isDirectory()) {
          printLine(
            `Found ${path.relative(GIT_ROOT, fileName)}`,
            Color.Gray,
          );
          graphInfoMap[fileName] = { summary: null, isDir: true };
        } else {
          const existing = repoMap[fileName];
          if (existing) {
            printLine(
              `Found ${path.relative(GIT_ROOT, fileName)}`,
              Color.Gray,
            );
            graphInfoMap[fileName] = { summary: existing, isDir: false };
          } else {
            printLine(
              `Processing ${path.relative(GIT_ROOT, fileName)}`,
              Color.Gray,
            );
            graphInfoMap[fileName] = {
              summary: (await processFile(fileName)) ?? null,
              isDir: false,
            };
          }
        }
      }

      return {
        success: true,
        message: `Summarised ${path.relative(GIT_ROOT, directoryName)}`,
        graphInfoMap,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to summarise ${path.relative(GIT_ROOT, directoryName)}`,
        content: `File not found or error reading file: ${error.message}`,
      };
    }
  },
});
