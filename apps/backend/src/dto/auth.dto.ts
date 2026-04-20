import type { UserSummary } from "./shared.dto";

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LogoutRequest {
  token: string;
}

/** Alias: same shape as nested user summaries elsewhere. */
export type AuthUser = UserSummary;

export interface AuthTokenResponse {
  user: AuthUser;
  token: string;
}

/** `GET /auth/me` — shape attached by JWT middleware. */
export interface MeResponse {
  id: number;
  role: string;
}
