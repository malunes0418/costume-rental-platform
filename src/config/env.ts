import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be provided as an environment variable`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 3000,
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: Number(process.env.DB_PORT) || 3306,
  dbUser: process.env.DB_USER || "root",
  dbPassword: process.env.DB_PASSWORD || "",
  dbName: process.env.DB_NAME || "costume_rental",
  jwtSecret: requireEnv("JWT_SECRET"),
  oauthGoogleClientId: process.env.OAUTH_GOOGLE_CLIENT_ID || "",
  oauthGoogleClientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET || "",
  oauthGoogleCallbackUrl: process.env.OAUTH_GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback",
  emailHost: process.env.EMAIL_HOST || "",
  emailPort: Number(process.env.EMAIL_PORT) || 587,
  emailUser: process.env.EMAIL_USER || "",
  emailPassword: process.env.EMAIL_PASSWORD || "",
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || "http://localhost:5173",
  fileUploadDir: process.env.FILE_UPLOAD_DIR || "uploads",
  sessionSecret: requireEnv("SESSION_SECRET")
};
