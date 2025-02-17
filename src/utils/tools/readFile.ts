import { tool } from "ai";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { GIT_ROOT } from "../files";
import { safelyNormalizePath } from "../safety";

export const readFile = tool({
  description: "Read text content from a file",
  parameters: z.object({
    fileName: z.string().describe("Name of the file to read"),
  }),
  execute: async ({ fileName }) => {
    try {
      const filePath = safelyNormalizePath(fileName);
      const content = await fs.promises.readFile(filePath, "utf-8");

      return {
        success: true,
        message: `Read ${path.relative(GIT_ROOT, fileName)}`,
        content,
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
