import * as fs from "node:fs";
import { findGitRoot } from "./files";

export async function startFileWatcher() {
  const root = findGitRoot(process.cwd());

  const changedFiles = new Set();

  fs.watch(root, { recursive: true }, (event, filename) => {
    if (event !== "change") return;
    if (filename) {
      if (filename.startsWith(".git")) return;
      const absolutePath = `${root}/${filename}`;
      fs.stat(absolutePath, (err, stats) => {
        if (err) return;
        if (stats.isFile()) {
          fs.readFile(absolutePath, "utf-8", (err) => {
            if (err) return;
            changedFiles.add(filename);
          });
        }
      });
    }
  });

  return changedFiles;
}
