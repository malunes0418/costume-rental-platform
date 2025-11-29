import { Request, Response, NextFunction } from "express";

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as { id: number; role: string } | undefined;
  if (!user || user.role !== "ADMIN") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  next();
}
