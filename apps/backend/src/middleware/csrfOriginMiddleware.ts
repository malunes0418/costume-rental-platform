import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function originAllowed(originHeader: string | undefined) {
  if (!originHeader) return false;
  try {
    const allowed = new URL(env.frontendBaseUrl).origin;
    const candidate = new URL(originHeader).origin;
    return candidate === allowed;
  } catch {
    return false;
  }
}

/**
 * Mitigates CSRF for cookie-authenticated mutating requests by requiring
 * Origin/Referer to match FRONTEND_BASE_URL. Bearer-token clients skip this
 * check (they are not automatically sent by browsers on cross-site form posts).
 */
export function csrfOriginMiddleware(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  if (req.path.startsWith("/api/webhooks") || req.originalUrl.startsWith("/api/webhooks")) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const hasBearer = typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ");
  if (hasBearer) {
    return next();
  }

  const cookieToken = req.cookies?.["crp.token"];
  if (!cookieToken) {
    return next();
  }

  const origin = req.get("Origin");
  const referer = req.get("Referer");
  if (originAllowed(origin) || originAllowed(referer)) {
    return next();
  }

  return res.status(403).json({ message: "Cross-site request blocked" });
}
