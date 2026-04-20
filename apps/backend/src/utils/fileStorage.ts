import path from "path";
import fs from "fs";
import { env } from "../config/env";

export function ensureUploadDir() {
  if (!fs.existsSync(env.fileUploadDir)) {
    fs.mkdirSync(env.fileUploadDir, { recursive: true });
  }
}

export function getProofFilePath(filename: string) {
  ensureUploadDir();
  return path.join(env.fileUploadDir, filename);
}
