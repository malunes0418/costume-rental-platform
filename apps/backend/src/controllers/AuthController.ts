import { Request, Response } from "express";
import { JwtHelper } from "../helpers/JwtHelper";
import { AuthService, parseOAuthIntent } from "../services/AuthService";
import { env } from "../config/env";
import {
  ApiResponse,
  AuthTokenResponse,
  LoginRequest,
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
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export class AuthController {
  getOAuthIntent(req: Request) {
    return parseOAuthIntent(req.query.intent ?? req.query.state);
  }

  getOAuthFailureRedirect(req: Request, error: unknown) {
    const intent = this.getOAuthIntent(req);
    const path = intent === "register" ? "/register" : "/login";
    const message = error instanceof Error ? error.message : "Google authentication failed";
    const params = new URLSearchParams({ oauthError: message });
    return `${env.frontendBaseUrl}${path}?${params.toString()}`;
  }

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
    res.redirect(`${env.frontendBaseUrl}/oauth/callback`);
  }

  oauthFailure(req: Request, res: Response, error: unknown) {
    res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: undefined });
    res.redirect(this.getOAuthFailureRedirect(req, error));
  }

  async logout(_req: Request, res: Response) {
    try {
      await authService.logout();
      res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: undefined });
      ApiResponse.ok(res, { message: "Logged out" } as MessageResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }
}
