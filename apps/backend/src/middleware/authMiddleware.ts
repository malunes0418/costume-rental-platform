import { Request, Response, NextFunction } from "express";
import { JwtHelper } from "../helpers/JwtHelper";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Prefer HttpOnly cookie; fall back to Bearer header (for Postman / API tools)
  const cookieToken = req.cookies?.["crp.token"] as string | undefined;
  const header = req.headers.authorization;
  const token = cookieToken ?? (header ? header.replace("Bearer ", "") : null);

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { sub, role, vendor_status } = JwtHelper.verifyToken(token);
    req.user = { id: sub, role, vendor_status };
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}
