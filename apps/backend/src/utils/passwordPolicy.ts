const MIN_PASSWORD_LENGTH = 8;

export function assertPasswordPolicy(password: string, label = "Password") {
  const value = password?.trim() ?? "";
  if (value.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`${label} must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
