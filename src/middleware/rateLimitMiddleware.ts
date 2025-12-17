import rateLimit from 'express-rate-limit';

// Rate limiting configuration constants
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const AUTH_MAX_REQUESTS = 5;
const API_MAX_REQUESTS = 100;
const ADMIN_MAX_REQUESTS = 50;

// Strict rate limit for authentication endpoints (login, register)
export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: AUTH_MAX_REQUESTS,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter for authenticated endpoints
export const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: API_MAX_REQUESTS,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for sensitive admin operations
export const adminLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: ADMIN_MAX_REQUESTS,
  message: 'Too many admin requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
