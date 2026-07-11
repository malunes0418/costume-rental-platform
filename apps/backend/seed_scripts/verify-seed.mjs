/**
 * Quick verification that seed data landed correctly (including Lalamove tables).
 * Run: npm run seed:verify
 */
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
const [[{ deliveryOrders }]] = await c.query("SELECT COUNT(*) deliveryOrders FROM delivery_orders");
const [[{ lalamoveVendors }]] = await c.query(
  "SELECT COUNT(*) lalamoveVendors FROM vendor_fulfillment_settings WHERE delivery_provider = 'LALAMOVE'"
);
const [[{ locationsWithCoords }]] = await c.query(
  "SELECT COUNT(*) locationsWithCoords FROM user_saved_locations WHERE latitude IS NOT NULL AND longitude IS NOT NULL"
);
const [[{ paymentMethods }]] = await c.query("SELECT COUNT(*) paymentMethods FROM vendor_payment_methods");
const [[{ fulfillmentPrefs }]] = await c.query("SELECT COUNT(*) fulfillmentPrefs FROM user_fulfillment_preferences");
const [[{ notifPrefs }]] = await c.query("SELECT COUNT(*) notifPrefs FROM user_notification_preferences");
const [[{ reservations }]] = await c.query("SELECT COUNT(*) reservations FROM reservations");
const [[{ fulfillments }]] = await c.query("SELECT COUNT(*) fulfillments FROM reservation_fulfillment");

const [sample] = await c.query(`
  SELECT c.name, LENGTH(ci.image_url) img_len
  FROM costumes c
  JOIN costume_images ci ON ci.costume_id = c.id AND ci.is_primary = 1
  ORDER BY c.id LIMIT 8
`);

const [deliverySample] = await c.query(`
  SELECT reservation_id, leg, status, service_type, price_amount
  FROM delivery_orders
  ORDER BY id LIMIT 8
`);

console.log("Costumes:", total, "| Images:", images, "| Duplicate names:", dup.length);
console.log("Reservations:", reservations, "| Fulfillments:", fulfillments);
console.log("Lalamove vendors:", lalamoveVendors, "| Delivery orders:", deliveryOrders);
console.log("Locations w/ coords:", locationsWithCoords, "| Payment methods:", paymentMethods);
console.log("Fulfillment prefs:", fulfillmentPrefs, "| Notification prefs:", notifPrefs);
console.table(sample);
if (deliverySample.length) {
  console.log("\nDelivery orders sample:");
  console.table(deliverySample);
}

await c.end();
