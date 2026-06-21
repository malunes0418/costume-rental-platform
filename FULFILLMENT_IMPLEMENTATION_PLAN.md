# Delivery, Pickup, and Returns Implementation Plan

## Goal

Implement structured fulfillment for reservations with:

- per-reservation outbound method selection
- separate return method selection
- vendor default fulfillment settings
- per-costume narrowing overrides
- saved renter locations
- vendor review with optional outside-area surcharge
- reservation lifecycle tracking from review through return completion
- payment architecture that works now with manual proof upload and later with automated gateways

## Delivery Strategy

Ship this in vertical phases so the system remains coherent at every checkpoint. Do not add UI states that the backend cannot yet support, and do not widen backend enums without updating shared types and screens in the same phase.

## Phase 1: Normalize Reservation Lifecycle

### Objective

Replace the overloaded reservation status model with an explicit lifecycle that can support fulfillment.

### Backend Work

- Update the reservation status enum in [Reservation.ts](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/backend/src/models/Reservation.ts)
- Add a migration to update the `reservations.status` enum
- Replace the current `vendor_status` usage or redefine its responsibility clearly
- Update all backend services that create or mutate reservation statuses:
  - [ReservationService.ts](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/backend/src/services/ReservationService.ts)
  - [PaymentService.ts](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/backend/src/services/PaymentService.ts)
  - [VendorService.ts](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/backend/src/services/VendorService.ts)
  - [AdminService.ts](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/backend/src/services/AdminService.ts)

### Frontend Work

- Update shared reservation types in:
  - [account.ts](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/lib/account.ts)
  - [vendor.ts](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/lib/vendor.ts)
  - [admin.ts](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/lib/admin.ts)
- Replace legacy status assumptions in:
  - [reservations/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/reservations/page.tsx)
  - [vendor/reservations/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/vendor/reservations/page.tsx)
  - [admin/reservations/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/admin/reservations/page.tsx)
  - [vendor/earnings/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/vendor/earnings/page.tsx)

### Proposed Status Set

- `CART`
- `PENDING_PAYMENT`
- `PENDING_VENDOR_REVIEW`
- `AWAITING_SURCHARGE_PAYMENT`
- `CONFIRMED`
- `OUTBOUND_SCHEDULED`
- `OUTBOUND_IN_PROGRESS`
- `WITH_RENTER`
- `RETURN_SCHEDULED`
- `RETURN_IN_PROGRESS`
- `RETURNED`
- `COMPLETED`
- `CANCELLED`
- `REJECTED_BY_VENDOR`

### Exit Criteria

- backend and frontend use the same status vocabulary
- admin and vendor pages stop referencing nonexistent statuses
- payment approval no longer implies fulfillment completion

## Phase 2: Add Fulfillment Data Model

### Objective

Introduce structured persistence for vendor fulfillment rules, renter saved locations, reservation fulfillment snapshots, and surcharge adjustments.

### Schema Additions

#### `vendor_fulfillment_settings`

- `vendor_id`
- primary business location fields
- outbound default mode
- return default mode
- fixed fee fields
- structured service areas

#### `costume_fulfillment_overrides`

- `costume_id`
- outbound mode override
- return mode override

#### `user_saved_locations`

- `user_id`
- label
- contact name
- phone number
- address details
- area metadata
- notes
- `is_default`

#### `reservation_fulfillment`

- `reservation_id`
- outbound method
- return method
- outbound location reference and snapshot
- return location reference and snapshot
- pickup time window
- delivery time window
- return time window
- snapped fixed fees
- outside-area flag
- fulfillment approval fields

#### `reservation_adjustments`

- `reservation_id`
- type
- amount
- status
- note

### Backend Work

- Add Sequelize models and associations in [index.ts](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/backend/src/models/index.ts)
- Add DTOs and validation schemas for the new entities
- Update OpenAPI export and route contracts

### Exit Criteria

- new entities can be created and read through backend services
- reservation records can store fulfillment snapshots without affecting current checkout yet

## Phase 3: Vendor Fulfillment Settings and Costume Overrides

### Objective

Let vendors configure their defaults, fees, primary location, and service area, then optionally narrow those choices per costume.

### Backend Work

- Add vendor fulfillment settings endpoints under vendor routes
- Add costume override create/update logic to vendor costume create/edit flows
- Enforce narrowing-only validation

### Frontend Work

- Add a vendor fulfillment settings screen
- Extend costume create/edit UI to show optional override controls
- Display validation clearly when an override tries to expand beyond vendor defaults

### Candidate Files

- [vendorRoutes.ts](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/backend/src/routes/vendorRoutes.ts)
- [VendorController.ts](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/backend/src/controllers/VendorController.ts)
- [VendorService.ts](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/backend/src/services/VendorService.ts)
- [vendor/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/vendor/page.tsx)
- [vendor/inventory/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/vendor/inventory/page.tsx)
- [AddCostumeModal.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/AddCostumeModal.tsx)
- [EditCostumeModal.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/EditCostumeModal.tsx)

### Exit Criteria

- vendors can set defaults and fees
- costumes can narrow available modes
- backend rejects invalid override combinations

## Phase 4: Saved Renter Locations

### Objective

Add account-level saved locations, while supporting creation during reservation flow and optional save-as-default behavior.

### Backend Work

- Add CRUD endpoints for renter saved locations
- Support “set as default” semantics

### Frontend Work

- Add a renter account management surface for locations, likely under the reservation/account area
- Add selector and create-new flow usable from reservation checkout

### Candidate Files

- new routes/controller/service for account locations in backend
- [reservations/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/reservations/page.tsx)
- [CartDrawer.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/CartDrawer.tsx)

### Exit Criteria

- renter can manage saved locations
- checkout can create and optionally default a new location

## Phase 5: Fulfillment Selection in Reservation Flow

### Objective

Collect fulfillment choices per reservation and persist them before payment proof submission.

### Backend Work

- Extend reservation/cart APIs to accept fulfillment payload
- Validate selected methods against vendor defaults and costume overrides
- Snapshot fixed fees and chosen locations into `reservation_fulfillment`
- Ensure cart grouping logic still works by vendor

### Frontend Work

- Extend the costume reservation flow in [costumes/[id]/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/costumes/[id]/page.tsx)
- Extend [CartDrawer.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/CartDrawer.tsx) to show:
  - outbound method selection per reservation
  - return method selection per reservation
  - location selectors
  - pickup, delivery, and return windows
  - fee breakdown

### Design Note

Because the user wants fulfillment per reservation, the cart drawer may become too dense if all controls live only inside the current grouped checkout summary. It may be better to gather fulfillment at add-to-cart time or via an editable per-reservation panel before payment.

### Exit Criteria

- each reservation can be checked out with structured fulfillment data
- fees are included in the initial amount
- payment proof submission uses the updated reservation totals

## Phase 6: Vendor Review and Surcharge Requests

### Objective

Allow vendor approval or rejection of submitted fulfillment details, plus outside-area surcharge requests.

### Backend Work

- Update vendor review service flow so approval happens from `PENDING_VENDOR_REVIEW`
- Add logic to create `reservation_adjustments` with type `OUTSIDE_AREA_SURCHARGE`
- Add reservation transition to `AWAITING_SURCHARGE_PAYMENT`
- Add additional payment submission support for pending adjustments

### Frontend Work

- Update [vendor/reservations/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/vendor/reservations/page.tsx) to show:
  - fulfillment snapshot
  - service area context
  - add surcharge action
  - approve / reject as submitted
- Update renter reservations UI to show:
  - surcharge requested state
  - surcharge amount
  - upload proof flow for the additional payment

### Exit Criteria

- vendor can request surcharge without editing renter selections
- renter can pay only the additional amount
- reservation transitions correctly after surcharge settlement

## Phase 7: Fulfillment Operations Lifecycle

### Objective

Track the real-world movement of the costume after approval.

### Backend Work

- Add actions for lifecycle transitions:
  - confirm
  - outbound scheduled
  - outbound in progress
  - with renter
  - return scheduled
  - return in progress
  - returned
  - completed
- Add validation guards so transitions cannot skip invalid states

### Frontend Work

- Add renter-facing lifecycle timeline on [reservations/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/reservations/page.tsx)
- Add vendor operational controls on [vendor/reservations/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/vendor/reservations/page.tsx)

### Exit Criteria

- renter and vendor both see the same fulfillment progress
- completed earnings/reporting can rely on real operational completion

## Phase 8: Admin, Reporting, and Earnings Alignment

### Objective

Bring admin and financial views into line with the new lifecycle.

### Backend Work

- Update admin reservation listing and moderation to expose fulfillment details and adjustments
- Revisit earnings logic to define which status counts as payable or cleared

### Frontend Work

- Update [admin/reservations/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/admin/reservations/page.tsx)
- Update [admin/payments/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/admin/payments/page.tsx)
- Update [vendor/earnings/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/vendor/earnings/page.tsx)

### Exit Criteria

- admin can inspect fulfillment and surcharge history
- vendor earnings use the new lifecycle consistently

## Cross-Cutting Concerns

### Validation

- vendor defaults and costume override narrowing rules
- delivery location required when delivery is selected
- service area checks
- separate time-window presence and ordering
- surcharge payment only when a pending adjustment exists

### Notifications

- reservation submitted
- vendor review required
- surcharge requested
- surcharge payment uploaded
- confirmed
- outbound scheduled
- return scheduled
- completed

### Availability and Scheduling

Initial version recommendation:

- keep current date overlap logic for reservation availability
- do not yet add cleaning, transit, or prep buffers unless required immediately

This can be a follow-up optimization once the core fulfillment workflow is stable.

### Testing

#### Backend

- service tests for reservation validation and transitions
- surcharge flow tests
- payment transaction linkage tests
- vendor override rule tests

#### Frontend

- cart/reservation flow tests
- vendor review UI tests
- lifecycle status rendering tests

#### Manual QA

- pickup out / pickup return
- delivery out / delivery return
- mixed outbound and return modes
- vendor default `delivery only`
- costume narrowed to `pickup only`
- outside-area surcharge flow
- rejected reservation flow

## Recommended Execution Order

### Milestone A

- Phase 1
- Phase 2

### Milestone B

- Phase 3
- Phase 4
- Phase 5

### Milestone C

- Phase 6
- Phase 7
- Phase 8

## Rollout Guidance

- hide unfinished fulfillment controls behind backend-ready routes only
- avoid partial status rollout where admin/vendor/renter interpret the same reservation differently
- migrate old reservations conservatively, mapping existing paid reservations into the closest stable state

## Immediate Next Task Recommendation

Start with Phase 1 and Phase 2 together:

1. define the final status vocabulary
2. add the new schema and models
3. update shared types

That creates a stable foundation before we touch checkout UX or vendor operations.
