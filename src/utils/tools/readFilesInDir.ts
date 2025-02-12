import { tool } from "ai";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { GIT_ROOT } from "../files";
import { loadRepoMap } from "../cache";
import { safelyNormalizePath } from "../safety";
import { processFile, type RepoMapSummary } from "../repo";

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

      const graphInfoMap: Record<string, RepoMapSummary> = {};
      for (const unsafeFile of fileNames) {
        const fileName = safelyNormalizePath(unsafeFile);
        graphInfoMap[fileName] =
          repoMap[fileName] || (await processFile(fileName));
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
