import { Request, Response, NextFunction } from "express";
import { JwtHelper } from "../helpers/JwtHelper";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Unauthorized" });
  const token = header.replace("Bearer ", "");
  try {
    const { sub, role } = JwtHelper.verifyToken(token);
    req.user = { id: sub, role };
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}
