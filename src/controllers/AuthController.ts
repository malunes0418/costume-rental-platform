import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;
      if (!email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
        return res.status(400).json({ message: "Valid email is required" });
      }
      if (!password || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      const result = await authService.register(email, password, name);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const result = await authService.login(email, password);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async me(req: Request, res: Response) {
    res.json((req as any).user);
  }

  oauthCallback(req: Request, res: Response) {
    const user = (req as any).user;
    const token = authService.generateToken(user);
    res.redirect(`${process.env.FRONTEND_BASE_URL || "http://localhost:5173"}/oauth/callback?token=${token}`);
  }
}
