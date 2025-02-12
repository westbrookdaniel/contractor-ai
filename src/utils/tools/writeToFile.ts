import { tool } from "ai";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { GIT_ROOT } from "../files";
import { safelyNormalizePath } from "../safety";
import { processFile } from "../repo";

export const writeToFile = tool({
  description: "Write text content to a file",
  parameters: z.object({
    fileName: z.string().describe("Name of the file to write to"),
    content: z
      .string()
      .describe(
        "Content to write to the file. Must be the complete contents of the file",
      ),
  }),
  execute: async ({ fileName: unsafe, content }) => {
    const fileName = safelyNormalizePath(unsafe);
    try {
      // Check if folder exists and create if not
      const folderPath = path.dirname(fileName);
      try {
        await fs.promises.access(folderPath);
      } catch {
        await fs.promises.mkdir(folderPath, { recursive: true });
      }

      await fs.promises.writeFile(fileName, content, { flag: "w" });

      // dont await, happen in the background
      void processFile(fileName);

      return {
        success: true,
        message: `+${path.relative(GIT_ROOT, fileName)}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `${fileName}: ${error.message}`,
      };
    }
  },
});
