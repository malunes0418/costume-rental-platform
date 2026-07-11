import path from "path";
import fs from "fs";
import { env } from "../config/env";

export function ensureUploadDir() {
  if (!fs.existsSync(env.fileUploadDir)) {
    fs.mkdirSync(env.fileUploadDir, { recursive: true });
  }
}

/** Resolve a stored `/uploads/...` URL or relative path to an absolute file path under FILE_UPLOAD_DIR. */
export function resolveUploadAbsolutePath(storedPath: string) {
  ensureUploadDir();
  const relative = storedPath.replace(/^\/?uploads\//, "").replace(/^\/+/, "");
  const absolute = path.resolve(env.fileUploadDir, relative);
  const root = path.resolve(env.fileUploadDir);
  if (!absolute.startsWith(root + path.sep) && absolute !== root) {
    throw new Error("Invalid upload path");
  }
  return absolute;
}

export function getProofFilePath(filename: string) {
  return resolveUploadAbsolutePath(filename);
}
