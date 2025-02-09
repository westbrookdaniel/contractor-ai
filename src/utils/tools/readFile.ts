import { tool } from "ai";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { GIT_ROOT } from "../files";
import { loadRepoMap } from "../cache";

export const readFile = tool({
  description: "Read text content from a file",
  parameters: z.object({
    fileName: z.string().describe("Name of the file to read"),
  }),
  execute: async ({ fileName }) => {
    try {
      const filePath = path.resolve(GIT_ROOT, fileName);
      const content = await fs.promises.readFile(filePath, "utf-8");
      const repoMap = loadRepoMap();
      const graphInfo = repoMap[fileName] || null;

      return {
        success: true,
        message: `Read ${path.relative(GIT_ROOT, fileName)}`,
        content,
        graphInfo,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to read ${path.relative(GIT_ROOT, fileName)}`,
        content: `File not found or error reading file: ${error.message}`,
      };
    }
  },
});
