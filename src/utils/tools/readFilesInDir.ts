import { tool } from "ai";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { GIT_ROOT } from "../files";
import { safelyNormalizePath } from "../safety";
import { Color, printLine } from "../io";

export const readFilesInDir = tool({
  description: "Get a summary for all the files in a directory",
  parameters: z.object({
    directoryName: z.string().describe("Name of the directory to read"),
  }),
  execute: async ({ directoryName: unsafe }) => {
    const directoryName = safelyNormalizePath(unsafe);
    try {
      const fileNames = await fs.promises.readdir(directoryName, "utf-8");

      printLine(
        `Searching ${path.relative(GIT_ROOT, directoryName)}`,
        Color.Gray,
      );

      const fileMap: Record<
        string,
        { contents: string | null; isDir: boolean }
      > = {};
      for (const unsafeFile of fileNames) {
        const fileName = safelyNormalizePath(
          path.join(directoryName, unsafeFile),
        );

        if (fs.statSync(fileName).isDirectory()) {
          // printLine(`Found ${path.relative(GIT_ROOT, fileName)}`, Color.Gray);
          fileMap[fileName] = { contents: null, isDir: true };
        } else {
          // printLine(`Found ${path.relative(GIT_ROOT, fileName)}`, Color.Gray);
          fileMap[fileName] = {
            contents: fs.readFileSync(fileName, "utf-8"),
            isDir: false,
          };
        }
      }

      return {
        success: true,
        message: `Searched ${path.relative(GIT_ROOT, directoryName)}`,
        graphInfoMap: fileMap,
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
