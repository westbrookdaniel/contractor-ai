import { tool } from "ai";
import fs from "fs";
import path from "path";
import { z } from "zod";

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
  execute: async ({ fileName, content }) => {
    try {
      // Check if folder exists and create if not
      const folderPath = path.dirname(fileName);
      try {
        await fs.promises.access(folderPath);
      } catch {
        await fs.promises.mkdir(folderPath, { recursive: true });
      }

      await fs.promises.writeFile(fileName, content, { flag: "w" });
      return {
        success: true,
        message: `+${fileName}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `${fileName}: ${error.message}`,
      };
    }
  },
});
