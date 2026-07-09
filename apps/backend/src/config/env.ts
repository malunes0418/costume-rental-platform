import dotenv from "dotenv";

dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not set`);
  }
  return value;
};

const requiredNumber = (key: string): number => {
  const value = Number(required(key));
  if (Number.isNaN(value)) {
    throw new Error(`${key} must be a valid number`);
  }
  return value;
};

const optional = (key: string): string | undefined => {
  return process.env[key];
};

export const env = {
  port: requiredNumber("PORT"),
  dbHost: required("DB_HOST"),
  dbPort: requiredNumber("DB_PORT"),
  dbUser: required("DB_USER"),
  dbName: required("DB_NAME"),
  dbPassword: optional("DB_PASSWORD"),
  dbCaCertPath: optional("DB_CA_CERT_PATH"),
  jwtSecret: required("JWT_SECRET"),
  oauthGoogleClientId: required("OAUTH_GOOGLE_CLIENT_ID"),
  oauthGoogleClientSecret: required("OAUTH_GOOGLE_CLIENT_SECRET"),
  oauthGoogleCallbackUrl: required("OAUTH_GOOGLE_CALLBACK_URL"),
  emailHost: required("EMAIL_HOST"),
  emailPort: requiredNumber("EMAIL_PORT"),
  emailUser: required("EMAIL_USER"),
  emailPassword: required("EMAIL_PASSWORD"),
  frontendBaseUrl: required("FRONTEND_BASE_URL"),
  fileUploadDir: required("FILE_UPLOAD_DIR"),
  // Geocoding — optional; if absent, Lalamove quoting falls back to static fees
  googleMapsApiKey: optional("GOOGLE_MAPS_API_KEY"),
  // Lalamove courier integration — optional; required when delivery_provider = LALAMOVE
  lalamoveApiKey: optional("LALAMOVE_API_KEY"),
  lalamoveApiSecret: optional("LALAMOVE_API_SECRET"),
  lalamoveMarket: optional("LALAMOVE_MARKET") ?? "PH",
  lalamoveBaseUrl: optional("LALAMOVE_BASE_URL") ?? "https://rest.sandbox.lalamove.com",
  lalamoveWebhookToken: optional("LALAMOVE_WEBHOOK_TOKEN"),
};
