import * as fs from "node:fs";
import { findGitRoot } from "./files";

export function startFileWatcher() {
  const root = findGitRoot(process.cwd());

  const changedFiles = new Set<string>();

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
            changedFiles.add(absolutePath);
          });
        }
      });
    }
  });

  return changedFiles;
}
