import multer from "multer";
import path from "path";
import crypto from "crypto";
import { env } from "../config/env";
import { ensureUploadDir } from "../utils/fileStorage";

ensureUploadDir();

const ALLOWED_FILE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'application/pdf': '.pdf'
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, env.fileUploadDir);
  },
  filename(req, file, cb) {
    const unique = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Validate extension
    const allowedExts = Object.values(ALLOWED_FILE_TYPES);
    if (!allowedExts.includes(ext)) {
      return cb(new Error('Invalid file type'), '');
    }
    
    cb(null, unique + ext);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!ALLOWED_FILE_TYPES[file.mimetype as keyof typeof ALLOWED_FILE_TYPES]) {
    return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'));
  }
  cb(null, true);
};

export const upload = multer({ 
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter
});
