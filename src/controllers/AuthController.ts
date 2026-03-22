import { Request, Response } from "express";
import { JwtHelper } from "../helpers/JwtHelper";
import { AuthService } from "../services/AuthService";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;
      const result = await authService.register(email, password, name);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
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
    const token = JwtHelper.generateToken(user);
    res.redirect(`${process.env.FRONTEND_BASE_URL || "http://localhost:5173"}/oauth/callback?token=${token}`);
  }

  async logout(req: Request, res: Response) {
    try {
      const { token } = req.body;
      await authService.logout(token);
      res.json({ message: "Logged out" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
}
