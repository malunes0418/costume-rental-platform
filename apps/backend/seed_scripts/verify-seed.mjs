import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

const c = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const [dup] = await c.query("SELECT name, COUNT(*) n FROM costumes GROUP BY name HAVING n > 1");
const [[{ total }]] = await c.query("SELECT COUNT(*) total FROM costumes");
const [[{ images }]] = await c.query("SELECT COUNT(*) images FROM costume_images");
const [sample] = await c.query(`
  SELECT c.name, LENGTH(ci.image_url) img_len
  FROM costumes c
  JOIN costume_images ci ON ci.costume_id = c.id AND ci.is_primary = 1
  ORDER BY c.id LIMIT 10
`);

console.log("Costumes:", total, "| Images:", images, "| Duplicate names:", dup.length);
console.table(sample);
await c.end();
