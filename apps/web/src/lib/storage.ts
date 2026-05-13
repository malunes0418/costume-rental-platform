// Token storage is no longer used — auth is handled via HttpOnly cookie.
// These stubs are kept for compatibility during transition; safe to delete.

export function readToken(): string | null {
  return null;
}

export function writeToken(_token: string | null) {
  // no-op
}
