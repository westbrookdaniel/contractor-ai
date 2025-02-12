import path from "path";
import { GIT_ROOT } from "./files";

export function safelyNormalizePath(inputPath: string): string {
  // Normalize the path to resolve '..' and '.' segments
  const normalizedPath = path.normalize(inputPath);

  // If the path is absolute, make it relative to GIT_ROOT
  const relativePath = path.isAbsolute(normalizedPath)
    ? path.relative(GIT_ROOT, normalizedPath)
    : normalizedPath;

  // Resolve the full path to check if it's within GIT_ROOT
  const resolvedPath = path.resolve(GIT_ROOT, relativePath);

  // Ensure the resolved path starts with GIT_ROOT
  if (!resolvedPath.startsWith(GIT_ROOT)) {
    return path.join(GIT_ROOT, resolvedPath);
  }

  // Return the path relative to GIT_ROOT
  return relativePath;
}
