# Lalamove Fulfillment Integration — Design Spec

**Date:** 2026-07-09  
**Status:** Approved  
**Phase:** Full backend integration (Phases 1–6)

---

## Understanding Summary

- **What:** Integrate Lalamove v3 API into the SnapCos fulfillment pipeline — live delivery quotes at checkout, real order booking at vendor dispatch and renter return initiation, and webhook-driven status tracking.
- **Why:** Replace static per-vendor delivery fees with market-rate courier quotes; automate booking so vendors never call Lalamove manually.
- **Who:** All vendors who set `delivery_provider = LALAMOVE` in their fulfillment settings. Renters see live fees; the platform is transparent.
- **Platform model:** One platform Lalamove account/wallet. Vendor static fees become the fallback if Lalamove quoting fails.
- **Geocoding:** Google Geocoding API (geocode-on-write only); missing coordinates silently revert to static-fee path.
- **Return leg:** Estimated fee charged at checkout; re-quoted and booked at return initiation. Platform absorbs small deltas (delta stored for reporting).

---

## Assumptions

- Lalamove API v3 (`rest.sandbox.lalamove.com` for sandbox, `rest.lalamove.com` for production).
- Market: Philippines (`PH`). Service type default: `MOTORCYCLE`.
- One platform Lalamove account with pre-funded wallet. Insufficient balance is a surfaced error (HTTP 402 from Lalamove), not a silent fallback.
- Google Geocoding only on address create/update. No per-request geocoding. Budget ~$5/1000 calls.
- Webhook HMAC token embedded in URL path (`/api/webhooks/lalamove/:token`); token is `LALAMOVE_WEBHOOK_TOKEN` env var.
- No background job queue in v1. Stale delivery status refreshed on-demand via `GET /api/reservations/:id/delivery`.
- Frontend (apps/web) is owned by a separate agent; this spec defines the API contracts the frontend must consume.

---

## Non-Goals (v1)

- Places Autocomplete / map pin UI
- Multi-stop orders or route optimization
- Per-vendor Lalamove accounts
- Automatic surcharge collection for return-fee deltas
- Background polling workers / job queue
- Delivery tracking for pickup-method reservations

---

## Delivery Flow

```
Renter configures cart (delivery address)
  → Backend calls Lalamove for two quotes (outbound + return)
  → Fees appear in reservation total (return marked as estimate)
  → Renter pays (existing proof-upload flow, unchanged)
  → Vendor approves booking
  → Vendor clicks Dispatch
      → Backend: fresh quote → placeOrder (outbound) → persist DeliveryOrder
      → Reservation → DELIVERY_SCHEDULED
  → Lalamove webhooks: DRIVER_ASSIGNED, ORDER_STATUS_CHANGED
      → Backend updates DeliveryOrder, notifies renter
  → Renter initiates return
      → Backend: fresh quote → placeOrder (return) → persist DeliveryOrder
      → Reservation → RETURN_PENDING
  → Lalamove webhook COMPLETED (return)
      → Backend notifies vendor to confirm receipt
  → Vendor confirms return → RETURNED → COMPLETED
```

---

## Data Model Changes

### New table: `delivery_orders`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | auto-increment |
| reservation_id | BIGINT UNSIGNED | FK → reservations; indexed |
| leg | ENUM('OUTBOUND','RETURN') | |
| lalamove_order_id | VARCHAR(120) | nullable until placed |
| quotation_id | VARCHAR(120) | nullable |
| service_type | VARCHAR(60) | e.g. MOTORCYCLE |
| status | VARCHAR(60) | Lalamove status string |
| price_amount | DECIMAL(10,2) | |
| price_currency | VARCHAR(10) | e.g. PHP |
| driver_name | VARCHAR(120) | nullable; set on DRIVER_ASSIGNED |
| driver_phone | VARCHAR(60) | nullable |
| share_link | VARCHAR(512) | nullable; Lalamove tracking URL |
| raw_webhook_payload | JSON | last received webhook body |
| checkout_fee_estimate | DECIMAL(10,2) | fee baked into reservation total at checkout |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### `vendor_fulfillment_settings` additions

| Column | Type | Default |
|--------|------|---------|
| delivery_provider | ENUM('MANUAL','LALAMOVE') | MANUAL |
| lalamove_service_type | VARCHAR(60) | MOTORCYCLE |

### `reservation_fulfillment` additions

| Column | Type | Default |
|--------|------|---------|
| return_fee_is_estimate | BOOLEAN | false |

### `user_saved_locations` additions

| Column | Type | Notes |
|--------|------|-------|
| latitude | DECIMAL(10,7) | nullable; geocoded on write |
| longitude | DECIMAL(10,7) | nullable; geocoded on write |

---

## New Services

### `GeocodingService`

- `geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null>`
- Called only on address save/update.
- Uses `GOOGLE_MAPS_API_KEY` env var (optional; if absent, returns null).
- Fail-soft: returns null on API error, network timeout, or empty result.

### `LalamoveClient`

HMAC-SHA256 signing per Lalamove docs:
```
stringToSign = `{timestamp}\r\n{METHOD}\r\n{path}\r\n\r\n{body}`
signature    = HMAC-SHA256(API_SECRET, stringToSign).hexDigest()
Authorization: hmac {API_KEY}:{timestamp}:{signature}
```

Methods:
- `createQuotation(payload)` → `{ quotationId, priceBreakdown: { total, currency } }`
- `getQuotation(quotationId)` → same shape
- `placeOrder(payload)` → `{ orderId, shareLink }`
- `getOrder(orderId)` → `{ status, driverInfo?, shareLink }`
- `cancelOrder(orderId)` → void
- `setWebhook(url)` → void

Environment variables:
- `LALAMOVE_API_KEY` (required for Lalamove features)
- `LALAMOVE_API_SECRET` (required for Lalamove features)
- `LALAMOVE_MARKET` (default: `PH`)
- `LALAMOVE_BASE_URL` (default: `https://rest.sandbox.lalamove.com`)
- `LALAMOVE_WEBHOOK_TOKEN` (random secret; embedded in webhook URL)

---

## API Endpoints (New)

### POST `/api/webhooks/lalamove/:token`

**Auth:** None (token in URL path acts as shared secret).  
**Request body:** Lalamove webhook payload (JSON).  
**Response:** Always `200 OK`.

Processes: `ORDER_STATUS_CHANGED`, `DRIVER_ASSIGNED`, `POD_STATUS_CHANGED`.

Status mapping:

| Lalamove status | Action |
|-----------------|--------|
| PICKED_UP | Notify renter "Out for delivery" |
| COMPLETED (outbound) | Record timestamp; notify renter to confirm receipt |
| COMPLETED (return) | Notify vendor to confirm return |
| CANCELED / EXPIRED / REJECTED | Flag DeliveryOrder; notify vendor to re-dispatch |
| DRIVER_ASSIGNED event | Save driver name + phone |

### GET `/api/reservations/:id/delivery`

**Auth:** JWT (renter or vendor of the reservation).  
**Response:**

```json
{
  "outbound": {
    "status": "PICKED_UP",
    "driver_name": "Juan Dela Cruz",
    "driver_phone": "+63912...",
    "share_link": "https://share.lalamove.com/...",
    "updated_at": "2026-07-09T12:00:00Z"
  } | null,
  "return": { ...same shape... } | null
}
```

Lazily polls Lalamove `getOrder` if last update is > 5 minutes ago (covers local dev without webhooks). Returns cached data otherwise.

### POST `/api/vendors/reservations/:id/dispatch` (extended)

Extended to support two-step flow for Lalamove:

**Step 1 (quote preview):** `GET /api/vendors/reservations/:id/dispatch-quote`  
Returns `{ quote_price, currency, service_type, quotation_id }`.

**Step 2 (book):** `POST /api/vendors/reservations/:id/dispatch`  
Body: `{ confirm_lalamove?: boolean }`. If vendor is LALAMOVE, books the order; if confirm_lalamove is false or vendor is MANUAL, proceeds with manual dispatch as today.

Response (Lalamove path):
```json
{
  "reservation": { ...reservation object... },
  "delivery_order": {
    "lalamove_order_id": "abc123",
    "share_link": "https://share.lalamove.com/...",
    "price_amount": 120.00,
    "price_currency": "PHP"
  }
}
```

### POST `/api/reservations/:id/return` (extended)

For LALAMOVE reservations: backend automatically re-quotes and books the return leg before advancing to `RETURN_PENDING`. No UI change needed — same endpoint.

---

## LocationSnapshot Extension

```typescript
interface LocationSnapshot {
  // existing fields...
  latitude?: number | null;   // added
  longitude?: number | null;  // added
}
```

Lalamove quotation uses lat/lng for route-pricing. If either coordinate is null, FulfillmentService falls back to static fees.

---

## VendorFulfillmentSettings Extension

```typescript
interface VendorFulfillmentSettingsRequest {
  // existing fields...
  delivery_provider?: 'MANUAL' | 'LALAMOVE';
  lalamove_service_type?: string;  // e.g. 'MOTORCYCLE', 'SEDAN'
}
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Missing lat/lng on renter or vendor location | Fall back to static fees; `outside_service_area` unchanged |
| Lalamove API error at checkout | Silently fall back to static fees; log warning |
| Lalamove 402 at dispatch (wallet empty) | Return error to vendor; reservation stays at CONFIRMED |
| Lalamove 402 at return booking | Return error; reservation stays at WITH_RENTER |
| Webhook arrives for unknown order | Log and return 200 (idempotent) |
| Duplicate webhook (retried by Lalamove) | Idempotent upsert on DeliveryOrder |
| Return fee delta (estimate vs actual) | Stored on DeliveryOrder; platform absorbs; flagged for reporting |
| Vendor switches LALAMOVE → MANUAL mid-reservation | In-flight delivery orders unaffected; new dispatch is manual |
| cancelOrder fails at Lalamove | Log; DeliveryOrder status set to CANCEL_FAILED |

---

## Testing Plan

### Unit tests (implemented in this phase)
- HMAC signature generation: known input → expected signature string.
- Webhook payload → status mapping: all Lalamove status strings map correctly.

### Sandbox E2E (separate testing agent)
- Full lifecycle: checkout quote → dispatch → DRIVER_ASSIGNED webhook → COMPLETED webhook → return initiation → return COMPLETED.
- Fallback path: vendor set to MANUAL, or geocoding disabled → static fees used.
- 402 error path: test insufficient wallet handling.

---

## Decision Log

| # | Decision | Alternatives | Rationale |
|---|----------|--------------|-----------|
| 1 | Platform-owned Lalamove account | Per-vendor accounts | Simpler billing; wallet top-up in one place |
| 2 | Geocode-on-write (not per-quote) | Per-quote geocoding | Cost control; Google Maps free tier ~$200/month |
| 3 | Fail-soft on geocoding failure | Hard fail | Checkout must never block on courier API |
| 4 | Two-step dispatch (quote then book) | One-step | Vendors see price before committing |
| 5 | Token-in-URL webhook auth | HMAC signature verify | Lalamove webhook does not sign payload; token is sufficient |
| 6 | On-demand poll instead of job queue | Cron / queue | No infrastructure added in v1; webhooks handle prod |
| 7 | Platform absorbs return-fee delta | Charge renter | UX simplicity; delta is typically small |

---

## Future Work (Out of Scope v1)

- Places Autocomplete with session tokens (reduce geocode cost at scale)
- Per-vendor Lalamove sub-accounts via API
- Automatic surcharge collection for return-fee deltas exceeding threshold
- Background polling worker (replace on-demand poll)
- Multi-stop orders for multi-costume reservations
- Delivery tracking map embed using Lalamove share link
