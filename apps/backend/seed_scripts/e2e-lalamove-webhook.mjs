/**
 * Local E2E: simulate a Lalamove ORDER_STATUS_CHANGED → COMPLETED webhook
 * against the running backend, then verify delivery_orders + notifications.
 *
 * Usage: node seed_scripts/e2e-lalamove-webhook.mjs [orderId]
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const orderId = process.argv[2] || "3536436988201218886";
const token = process.env.LALAMOVE_WEBHOOK_TOKEN || "";

if (!token || token.startsWith("http")) {
  console.error("LALAMOVE_WEBHOOK_TOKEN must be the path secret only (not a full URL).");
  process.exit(1);
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Reset so the test is meaningful even if a prior run already completed it
await conn.query(
  `UPDATE delivery_orders
   SET status = 'PICKED_UP', driver_name = NULL, driver_phone = NULL, raw_webhook_payload = NULL
   WHERE lalamove_order_id = ?`,
  [orderId]
);

const payload = {
  eventType: "ORDER_STATUS_CHANGED",
  status: "COMPLETED",
  orderId,
  order: {
    id: orderId,
    status: "COMPLETED",
    driverInfo: { name: "Test Driver 34567", phone: "+639171111111" },
    shareLink: "https://share.sandbox.lalamove.com?e2e-test"
  }
};

const url = `http://localhost:4000/api/webhooks/lalamove/${encodeURIComponent(token)}`;
const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});
console.log("POST", { url, status: res.status });

await new Promise((r) => setTimeout(r, 1000));

const [rows] = await conn.query(
  `SELECT id, reservation_id, status, driver_name, driver_phone, updated_at,
          JSON_EXTRACT(raw_webhook_payload, '$.status') AS webhook_status
   FROM delivery_orders WHERE lalamove_order_id = ?`,
  [orderId]
);
console.log("AFTER_WEBHOOK_DB", rows);

const reservationId = rows[0]?.reservation_id;
let notifs = [];
if (reservationId) {
  [notifs] = await conn.query(
    `SELECT id, user_id, title, message, created_at
     FROM notifications
     WHERE message LIKE ?
     ORDER BY id DESC
     LIMIT 5`,
    [`%reservation #${reservationId}%`]
  );
  console.log("RECENT_NOTIFS", notifs);
}

const hasCompletedNotif = notifs.some(
  (n) => n.title === "Costume delivered" || String(n.message).includes("has been delivered")
);
const passed = res.status === 200 && rows[0]?.status === "COMPLETED" && hasCompletedNotif;

console.log(passed ? "E2E_PASS" : "E2E_FAIL");
await conn.end();
process.exit(passed ? 0 : 1);
