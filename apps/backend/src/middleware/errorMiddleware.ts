import { Request, Response, NextFunction } from "express";
import multer from "multer";

export function errorMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err instanceof multer.MulterError ? 400 : err.status || 500;
  const isProduction = process.env.NODE_ENV === "production";
  const message =
    err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
      ? "Upload exceeds the 8MB file size limit"
      : status >= 500 && isProduction
        ? "Internal server error"
        : err.message || "Internal server error";
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ message });
}
