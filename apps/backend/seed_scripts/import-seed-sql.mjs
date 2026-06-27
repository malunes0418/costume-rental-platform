/**
 * Import seed.sql into the database using .env credentials.
 * Run: npm run seed:import
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env") });

const seedPath = join(__dirname, "seed.sql");
const sql = readFileSync(seedPath, "utf8");

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "costume_rental",
  multipleStatements: true,
});

try {
  console.log(`Importing ${seedPath}...`);
  await connection.query(sql);
  const [[{ cnt }]] = await connection.query("SELECT COUNT(*) AS cnt FROM users");
  console.log(`Seed import complete. Users in database: ${cnt}`);
} finally {
  await connection.end();
}
