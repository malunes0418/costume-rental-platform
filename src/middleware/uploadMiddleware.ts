import multer from "multer";
import path from "path";
import { env } from "../config/env";
import { ensureUploadDir } from "../utils/fileStorage";

ensureUploadDir();

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

export const upload = multer({ storage });
