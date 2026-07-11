import multer from "multer";
import path from "path";
import fs from "fs";
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { ensureUploadDir } from "../utils/fileStorage";

ensureUploadDir();

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
]);

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf"
};

type UploadRequest = Request & { uploadKind?: string };

function safeExtFor(file: Express.Multer.File) {
  const fromMime = MIME_TO_EXT[file.mimetype];
  if (fromMime) return fromMime;
  const original = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXT.has(original)) return original;
  return "";
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const kind = (req as UploadRequest).uploadKind;
    const subdir = kind === "id_document" ? "ids" : kind === "proof" ? "proofs" : "public";
    const dest = path.join(env.fileUploadDir, subdir);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename(req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = safeExtFor(file);
    cb(null, unique + ext);
  }
});

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".svg" || ext === ".html" || ext === ".htm" || file.mimetype === "image/svg+xml") {
    cb(new Error("SVG and HTML uploads are not allowed"));
    return;
  }

  if (!ALLOWED_MIME.has(file.mimetype)) {
    cb(new Error("Only JPEG, PNG, WebP, and PDF uploads are allowed"));
    return;
  }

  if (ext && !ALLOWED_EXT.has(ext) && !MIME_TO_EXT[file.mimetype]) {
    cb(new Error("Only JPEG, PNG, WebP, and PDF uploads are allowed"));
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_BYTES }
});

/** Relative URL path under /uploads for a stored file (includes subdirectory). */
export function uploadPublicPath(file: Express.Multer.File) {
  const relative = path.relative(env.fileUploadDir, file.path).split(path.sep).join("/");
  return `/uploads/${relative}`;
}

export function setUploadKind(kind: "id_document" | "proof" | "public") {
  return (req: Request, _res: Response, next: NextFunction) => {
    (req as UploadRequest).uploadKind = kind;
    next();
  };
}
