import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";

export class JwtHelper {
  static generateToken(user: User): string {
    return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: "7d" });
  }

  static verifyToken(token: string): { sub: number; role: string } {
    const decoded = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload & { role?: string };
    return { 
      sub: Number(decoded.sub), 
      role: decoded.role ?? "USER"
    };
  }
}
