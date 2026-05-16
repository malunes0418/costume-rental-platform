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

export function resolvePostLoginPath(user: RedirectUser | null | undefined, next: string | null | undefined) {
  const defaultPath = getDefaultPostLoginPath(user);

  if (defaultPath !== "/") {
    return defaultPath;
  }

  if (!next) {
    return defaultPath;
  }

  const trimmedNext = next.trim();
  if (!trimmedNext.startsWith("/") || trimmedNext.startsWith("//")) {
    return defaultPath;
  }

  const pathname = trimmedNext.split(/[?#]/, 1)[0] || "/";
  if (isBlockedPostLoginPath(pathname)) {
    return defaultPath;
  }

  return trimmedNext;
}
