# Multi-Vendor Marketplace Design

## 📋 Understanding Summary

- **What:** A multi-vendor marketplace where individual owners list their costumes for rent, with full vendor lifecycle management
- **Why:** Transform the platform into a community-powered Airbnb-style costume marketplace
- **Who:** Authenticated users apply to become vendors → Admin reviews KYC docs → Admin approves/rejects → Vendor manages listings → Renters browse & request → **Vendor approves/rejects each reservation request**
- **Key constraints:**
  - KYC = government ID photo upload, manually reviewed by admin
  - Reservation flow becomes **2-step**: renter requests → vendor confirms or rejects
  - Admin can flag/hide individual listings without banning vendor account
  - No payment split logic now; payouts deferred
  - Small scale (~10–50 vendors), solo maintainer — keep it lean

## 🔶 Assumptions

| # | Assumption |
|---|---|
| A1 | `User` model gains a `vendorStatus` field: `none` → `pending` → `approved` → `rejected` |
| A2 | A new `VendorProfile` table stores KYC doc URL + metadata (uploaded file path via existing `uploads/`) |
| A3 | `Costume` model gains `owner_id` FK to the vendor's user, plus `status` field (`active`, `flagged`, `hidden`) |
| A4 | `Reservation` gains a `vendorStatus` field: `pending_vendor` → `confirmed` → `rejected_by_vendor` |
| A5 | A new `Message` model handles renter ↔ vendor in-platform chat (plain text, per reservation thread) |
| A6 | Earnings dashboard is read-only, derived from existing `Payment`/`Reservation` records |
| A7 | KYC document stored in existing `uploads/` directory; file path saved in `VendorProfile` |

## 📐 Architecture & Database Schema

**1. User Model**
- Add `vendor_status`: ENUM(`NONE`, `PENDING`, `APPROVED`, `REJECTED`). Default `NONE`.

**2. VendorProfile Model**
- `id` (PK)
- `user_id` (FK to `users`, UNIQUE)
- `business_name` (Optional string)
- `bio` (Optional text)
- `id_document_url` (Required string)
- Timestamps

**3. Costume Model**
- Add `owner_id` (FK to `users`)
- Add `status`: ENUM(`ACTIVE`, `HIDDEN`, `FLAGGED`)

**4. Reservation Model**
- Add `vendor_status`: ENUM(`PENDING_VENDOR`, `CONFIRMED`, `REJECTED_BY_VENDOR`)

**5. Message Model**
- `id` (PK)
- `reservation_id` (FK to `reservations`)
- `sender_id` (FK to `users`)
- `content` (Text)
- Timestamps

## 🔌 API Endpoints

### Vendor Application (KYC)
- `POST /api/vendors/apply` (Upload docs, set status to `PENDING`)
- `GET /api/vendors/me` (Get profile/status)

### Admin Moderation
- `GET /api/admin/vendors/pending` (List applications)
- `POST /api/admin/vendors/:userId/approve` 
- `POST /api/admin/vendors/:userId/reject`
- `PATCH /api/admin/costumes/:id/status` (Flag/hide costumes)

### Vendor Listing Management
- `GET /api/vendors/costumes`
- `POST /api/vendors/costumes`
- `PUT /api/vendors/costumes/:id`
- `DELETE /api/vendors/costumes/:id`

### Reservation Management
- `GET /api/vendors/reservations` (View received requests)
- `POST /api/vendors/reservations/:id/approve`
- `POST /api/vendors/reservations/:id/reject`

### Messaging
- `GET /api/reservations/:id/messages`
- `POST /api/reservations/:id/messages`

## 🪵 Decision Log

| Decision | Alternatives Considered | Rationale |
|---|---|---|
| **KYC Process** | Third-party service (e.g., Stripe Identity) | Keep it simple for MVP. Manual admin review of uploaded documents is sufficient for small-scale launch. |
| **Vendor Profile Storage** | Add fields directly to `User` table | Approach 1 (`VendorProfile` table) keeps the `users` table clean for the majority of non-vendor users, while maintaining a clear 1:1 relationship. |
| **Reservation Flow** | Instant confirmation | Vendors need control to approve/reject based on their manual review of inventory and renter profile. |
| **Messaging** | Complex encrypted chat | Basic plain-text messages tied to a reservation ID are enough to facilitate coordination without over-engineering. |
| **Payment Splitting** | Automated split at checkout | Deferred to focus on core marketplace logic first. Platform collects everything, manual payouts later. |
