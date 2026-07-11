export type RedirectUser = {
  role?: string | null;
  vendor_status?: string | null;
};

const BLOCKED_POST_LOGIN_PREFIXES = ["/admin", "/vendor", "/login", "/register", "/oauth"];

function isBlockedPostLoginPath(pathname: string) {
  return BLOCKED_POST_LOGIN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function getDefaultPostLoginPath(user: RedirectUser | null | undefined) {
  if (user?.role === "ADMIN") {
    return "/admin";
  }

  if (user?.vendor_status && user.vendor_status !== "NONE") {
    return "/vendor";
  }

  return "/";
}

export function sanitizeInternalNext(next: string | null | undefined, fallback = "/") {
  if (!next) {
    return fallback;
  }

  const trimmedNext = next.trim();
  if (!trimmedNext.startsWith("/") || trimmedNext.startsWith("//")) {
    return fallback;
  }

  const pathname = trimmedNext.split(/[?#]/, 1)[0] || "/";
  if (isBlockedPostLoginPath(pathname)) {
    return fallback;
  }

  return trimmedNext;
}

export function resolvePostLoginPath(user: RedirectUser | null | undefined, next: string | null | undefined) {
  const defaultPath = getDefaultPostLoginPath(user);

  if (defaultPath !== "/") {
    return defaultPath;
  }

  return sanitizeInternalNext(next, defaultPath);
}
