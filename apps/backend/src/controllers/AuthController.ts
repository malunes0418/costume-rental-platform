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

const COOKIE_NAME = "crp.token";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body as RegisterRequest);
      res.cookie(COOKIE_NAME, result.token, COOKIE_OPTS);
      ApiResponse.ok(res, result as AuthTokenResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body as LoginRequest);
      res.cookie(COOKIE_NAME, result.token, COOKIE_OPTS);
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
    res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
    // Redirect without token in URL — cookie handles auth
    res.redirect(`${env.frontendBaseUrl}/oauth/callback`);
  }

  async logout(req: Request, res: Response) {
    try {
      await authService.logout(req.body as LogoutRequest);
      res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: undefined });
      ApiResponse.ok(res, { message: "Logged out" } as MessageResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }
}

