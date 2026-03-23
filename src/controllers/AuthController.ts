import { Request, Response } from "express";
import { JwtHelper } from "../helpers/JwtHelper";
import { AuthService } from "../services/AuthService";
import { env } from "../config/env";
import {
  ApiResponse,
  AuthTokenResponse,
  LoginRequest,
  LogoutRequest,
  MeResponse,
  MessageResponse,
  RegisterRequest
} from "../dto";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body as RegisterRequest);
      ApiResponse.ok(res, result as AuthTokenResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body as LoginRequest);
      ApiResponse.ok(res, result as AuthTokenResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async me(req: Request, res: Response) {
    ApiResponse.ok(res, req.user as MeResponse);
  }

  oauthCallback(req: Request, res: Response) {
    const user = (req as any).user;
    const token = JwtHelper.generateToken(user);
    res.redirect(`${process.env.FRONTEND_BASE_URL || "http://localhost:5173"}/oauth/callback?token=${token}`);
  }

  async logout(req: Request, res: Response) {
    try {
      await authService.logout(req.body as LogoutRequest);
      ApiResponse.ok(res, { message: "Logged out" } as MessageResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }
}
