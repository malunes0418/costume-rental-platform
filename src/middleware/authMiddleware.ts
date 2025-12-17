import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const token = header.substring(7); // Remove 'Bearer '
  
  try {
    const decoded = jwt.verify(token, env.jwtSecret, {
      algorithms: ['HS256']
    }) as any;
    
    if (!decoded.sub || !decoded.role) {
      throw new Error('Invalid token structure');
    }
    
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch (error) {
    // Log error for monitoring (don't expose details to client)
    console.error('Auth error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(401).json({ message: "Invalid token" });
  }
}
