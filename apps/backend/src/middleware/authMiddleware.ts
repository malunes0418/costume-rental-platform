import { Request, Response, NextFunction } from "express";
import { JwtHelper } from "../helpers/JwtHelper";
import { User } from "../models/User";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Prefer HttpOnly cookie; fall back to Bearer header (for Postman / API tools)
  const cookieToken = req.cookies?.["crp.token"] as string | undefined;
  const header = req.headers.authorization;
  const token = cookieToken ?? (header ? header.replace("Bearer ", "") : null);

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { sub, role } = JwtHelper.verifyToken(token);
    const user = await User.findByPk(sub);

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      role: user.role ?? role,
      vendor_status: user.vendor_status
    };
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}
