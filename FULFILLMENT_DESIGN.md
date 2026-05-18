# Delivery, Pickup, and Returns Design

## Understanding Summary

- Add structured fulfillment to costume reservations so each reservation can choose outbound and return handling separately.
- Renters choose fulfillment per reservation, not once for the entire cart or vendor order.
- Vendors define account-level fulfillment defaults, and costumes may override those defaults only by narrowing the available options.
- Vendors may charge optional fixed fulfillment fees, while outside-area surcharges are added per reservation after vendor review.
- Renters use saved account-level locations, but may also enter a location during reservation flow and save it as their default.
- Fulfillment needs its own operational lifecycle after payment and vendor approval.
- The design should support the current manual proof-of-payment flow while staying compatible with future payment gateways such as Stripe, PayPal, or PayMongo.

## Assumptions

- Performance: fulfillment validation and price calculation should happen inline during reservation flow without adding extra page hops.
- Security and privacy: renter location data should only be visible to the renter, the relevant vendor, and admins.
- Reliability: once a reservation is submitted, its fulfillment selections, time windows, addresses, and fees should be snapshotted and preserved historically.
- Scope: v1 uses structured service areas and fixed fees rather than route-based pricing, live courier APIs, or distance matrix calculations.
- Maintainability: status normalization is included in this project because the current reservation and admin/vendor views already drift from the existing backend model.

## Decision Log

- Decided: renters choose outbound fulfillment per reservation.
- Decided: renters choose return fulfillment separately from outbound.
- Decided: vendors have global fulfillment defaults plus per-costume overrides.
- Decided: costume overrides may narrow vendor defaults, but may not expand them.
- Decided: vendors can configure optional fixed fulfillment fees.
- Decided: renters use account-level saved locations, but can create one during reservation flow and save it as default.
- Decided: vendors have one primary business location.
- Decided: pickup, delivery, and return each have their own time window.
- Decided: vendor service coverage is modeled using structured service areas.
- Decided: if the renter is outside the service area, the vendor may add an extra surcharge per reservation after reviewing the address.
- Decided: vendors approve or reject fulfillment details as submitted and may not edit the methods or time windows.
- Decided: reservations should use a distinct post-payment fulfillment lifecycle rather than overloading `PAID`.
- Decided: outside-area surcharges should use an additional payment step so the flow stays compatible with future payment gateways.

## Recommended Architecture

### 1. Reservation-Centered Fulfillment Model

Keep `reservations` as the main booking record and add a structured fulfillment layer tied to each reservation. This preserves the current architecture while making fulfillment explicit enough for renter UX, vendor review, admin support, and future payment gateway integration.

### 2. Data Model

#### `vendor_fulfillment_settings`

One row per vendor:

- `vendor_id`
- primary business location fields
- outbound default mode: `PICKUP`, `DELIVERY`, `BOTH`
- return default mode: `PICKUP`, `DELIVERY`, `BOTH`
- optional fixed fee fields:
  - outbound pickup fee
  - outbound delivery fee
  - return pickup fee
  - return delivery fee
- structured service area configuration

#### `costume_fulfillment_overrides`

Optional row per costume:

- `costume_id`
- outbound allowed mode override
- return allowed mode override

Validation rule:

- overrides may only narrow the vendor defaults
- examples:
  - vendor `BOTH` -> costume may become `PICKUP` or `DELIVERY`
  - vendor `DELIVERY` -> costume may not enable pickup

#### `user_saved_locations`

Saved renter locations:

- `user_id`
- label such as `Home`, `Office`, `Studio`
- contact name
- phone number
- address lines / location details
- city / area metadata aligned with service area checks
- optional notes
- `is_default`

#### `reservation_fulfillment`

One row per reservation, storing the booking snapshot:

- `reservation_id`
- outbound method
- return method
- outbound location id plus copied snapshot fields
- return location id plus copied snapshot fields
- pickup / delivery / return time windows
- base fulfillment fees snapped at booking time
- outside-area flag
- vendor approval state for fulfillment details

#### `reservation_adjustments`

Additional reservation-level charges:

- `reservation_id`
- type such as `OUTSIDE_AREA_SURCHARGE`
- amount
- reason / note
- status: `PENDING`, `PAID`, `WAIVED`, `REJECTED`

This enables exception fees now and broader fee/refund support later.

### 3. Payment Model Direction

The current `payments` table should evolve from “single proof upload” into “payment transaction record.” A payment record should be able to represent:

- initial reservation payment
- surcharge payment
- future refund or deposit settlement flows

This keeps the current manual upload flow intact while making gateway integration feasible later without redesigning the reservation domain again.

## Reservation Lifecycle

### Payment and Review

- `CART`
- `PENDING_PAYMENT`
- `PENDING_VENDOR_REVIEW`
- `AWAITING_SURCHARGE_PAYMENT` when vendor adds an outside-area fee
- `CONFIRMED`

### Fulfillment Progress

- `OUTBOUND_SCHEDULED`
- `OUTBOUND_IN_PROGRESS`
- `WITH_RENTER`
- `RETURN_SCHEDULED`
- `RETURN_IN_PROGRESS`
- `RETURNED`
- `COMPLETED`

### Terminal States

- `CANCELLED`
- `REJECTED_BY_VENDOR`

## Flow Design

### Renter Reservation Flow

For each reservation:

1. Select outbound method.
2. Select return method.
3. Validate both against vendor defaults and costume narrowing rules.
4. Select saved location for any delivery-related step, or create a new one and optionally save it as default.
5. Select pickup, delivery, and return windows.
6. Calculate:
   - rental total
   - fixed fulfillment fees
   - initial payable total
7. Submit reservation with fulfillment snapshot attached.
8. Upload payment proof for the initial amount.

### Vendor Review Flow

After payment proof is submitted:

1. Vendor reviews reservation details, fulfillment methods, locations, and time windows.
2. Vendor may approve or reject the reservation as submitted.
3. Vendor may not edit fulfillment methods or time windows.
4. If the address is outside the normal service area:
   - vendor adds `outside_area_surcharge`
   - reservation moves to `AWAITING_SURCHARGE_PAYMENT`
   - renter is notified to pay the additional amount
5. After surcharge payment is received and approved, reservation proceeds to `CONFIRMED`.

### Exception Flow: Outside-Area Surcharge

This flow is intentional because the current payment occurs before vendor review:

- renter pays base rental plus fixed fulfillment fees
- vendor later reviews exact address
- if needed, vendor adds surcharge
- renter pays only the delta
- system preserves a clear audit trail of:
  - original amount
  - surcharge amount
  - separate payment records

This design also maps cleanly to future payment gateway top-ups or supplemental charges.

## API and Backend Workstreams

### Schema

- add fulfillment settings table for vendors
- add costume override table
- add saved renter locations table
- add reservation fulfillment table
- add reservation adjustments table
- normalize reservation status enum and related usage
- evolve payment metadata to support initial and supplemental payments

### Backend Logic

- validate vendor defaults and costume narrowing rules during reservation creation
- calculate fixed fulfillment fees at reservation time
- snapshot fulfillment selections onto the reservation
- check service area eligibility during vendor review
- create surcharge adjustments when applicable
- support additional payment submission for pending adjustments
- expose lifecycle transitions for outbound and return stages

### Notifications

- reservation awaiting vendor review
- surcharge requested
- surcharge payment received
- reservation confirmed
- outbound scheduled / in progress
- return due / in progress
- returned / completed

## Frontend Workstreams

### Renter

- reservation flow UI for outbound and return method selectors
- saved location selector and “save as default” flow
- time-window inputs for pickup, delivery, and return
- fulfillment fee breakdown in pricing summary
- reservation details page updates for fulfillment summary and lifecycle tracking
- surcharge request state and extra payment upload flow

### Vendor

- fulfillment settings page:
  - primary business location
  - default outbound and return modes
  - fixed fee configuration
  - structured service areas
- costume editor support for narrowing overrides
- reservation review UI showing fulfillment snapshot
- approve / reject actions
- add surcharge action when outside service area
- operational lifecycle controls after confirmation

### Admin

- normalize reservation status presentation
- show fulfillment snapshot and adjustments
- support dispute and override visibility with the new lifecycle

## Existing Gaps To Fix During Implementation

- backend reservation status model currently only supports `CART`, `PENDING_PAYMENT`, `PAID`, and `CANCELLED`
- vendor and admin screens already reference statuses that do not exist in the backend, such as `APPROVED` and `COMPLETED`
- current availability logic does not account for fulfillment prep, transit, or return buffers
- current payment model assumes one manual proof flow and needs to expand for surcharge handling

## Risks

- status migration can break admin and vendor reporting if not normalized everywhere at once
- service area logic can become inconsistent if address schema and vendor area schema are too loose
- surcharge exception handling adds a second payment step, so notifications and UI state must be very clear
- fulfillment lifecycle introduces more transitions, so auditability and validation guards matter

## Recommended Implementation Order

1. Normalize status model and define the new lifecycle in backend and shared types.
2. Add fulfillment settings, costume overrides, saved locations, and reservation fulfillment schema.
3. Update renter reservation flow to collect fulfillment choices and location data.
4. Update vendor review to approve/reject fulfillment and add surcharge requests.
5. Add reservation adjustments and supplemental payment support.
6. Add renter lifecycle tracking and vendor operational lifecycle actions.
7. Update admin reporting, earnings logic, and reservation moderation to use the normalized lifecycle.

## Non-Goals For V1

- live courier integrations
- auto-calculated map distance pricing
- vendor-edited renter-selected time windows
- multi-location vendor operations
- automated payment gateway integration in this phase
