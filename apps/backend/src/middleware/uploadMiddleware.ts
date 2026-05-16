import multer from "multer";
import path from "path";
import { env } from "../config/env";
import { ensureUploadDir } from "../utils/fileStorage";

ensureUploadDir();

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, env.fileUploadDir);
  },
  filename(req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
    cb(null, true);
    return;
  }

  cb(new Error("Only image and PDF uploads are allowed"));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_BYTES }
});
