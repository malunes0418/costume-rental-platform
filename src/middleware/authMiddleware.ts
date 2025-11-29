import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";

const authService = new AuthService();

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const payload = authService.verifyToken(parts[1]);
    (req as any).user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
}
