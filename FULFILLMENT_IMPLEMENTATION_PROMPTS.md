# Delivery, Pickup, and Returns Implementation Prompts

## How To Use

These prompts are designed for Codex or another coding agent working inside this repository. Each prompt includes the recommended skills to invoke and references the design docs:

- [FULFILLMENT_DESIGN.md](C:/Users/cayma/Documents/GitHub/costume-rental-platform/FULFILLMENT_DESIGN.md)
- [FULFILLMENT_IMPLEMENTATION_PLAN.md](C:/Users/cayma/Documents/GitHub/costume-rental-platform/FULFILLMENT_IMPLEMENTATION_PLAN.md)

Use the master prompt when you want the agent to own a full milestone. Use the focused prompts when you want tighter execution by layer or by phase.

## Recommended Skills

Core skills for this project:

- `brainstorming`
- `senior-architect`
- `senior-backend`
- `senior-frontend`
- `senior-qa`
- `code-reviewer`
- `impeccable`

Suggested usage by purpose:

- architecture and sequencing: `brainstorming`, `senior-architect`
- database, API, service logic: `senior-backend`, `senior-architect`
- renter/vendor/admin UI work: `senior-frontend`, `impeccable`
- testing and validation: `senior-qa`, `code-reviewer`

## 1. Master Milestone Prompt

### Skills Needed

- `senior-architect`
- `senior-backend`
- `senior-frontend`
- `senior-qa`
- `code-reviewer`
- `impeccable`

### Prompt

```text
Use `senior-architect`, `senior-backend`, `senior-frontend`, `senior-qa`, `code-reviewer`, and `impeccable`.

Implement the Delivery / Pickup / Returns feature for this repository using:
- FULFILLMENT_DESIGN.md
- FULFILLMENT_IMPLEMENTATION_PLAN.md

Execution rules:
- Follow the implementation plan milestone currently requested.
- Inspect the existing code before editing.
- Keep backend and frontend status vocabularies fully aligned.
- Do not leave partial lifecycle rollouts where renter, vendor, and admin screens disagree.
- Preserve current behavior unless the design explicitly changes it.
- Use the project’s existing TypeScript, Next.js, Express, and Sequelize patterns.
- For frontend work, preserve the repository’s premium theatrical visual language and avoid generic dashboard styling.

Deliverables:
1. Implement the requested milestone end to end.
2. Add or update migrations, models, DTOs, services, routes, frontend types, and UI as needed.
3. Add tests where appropriate.
4. Run relevant verification commands.
5. Summarize changes, risks, and follow-up items.

Start by reviewing the milestone scope and listing the concrete files you expect to touch, then implement the work.
```

## 2. Milestone A Prompt

### Skills Needed

- `senior-architect`
- `senior-backend`
- `senior-frontend`
- `senior-qa`

### Prompt

```text
Use `senior-architect`, `senior-backend`, `senior-frontend`, and `senior-qa`.

Implement Milestone A from FULFILLMENT_IMPLEMENTATION_PLAN.md:
- Phase 1: Normalize Reservation Lifecycle
- Phase 2: Add Fulfillment Data Model

Requirements:
- Introduce the new reservation lifecycle and remove status drift between backend and frontend.
- Add the new fulfillment-related schema and Sequelize models:
  - vendor_fulfillment_settings
  - costume_fulfillment_overrides
  - user_saved_locations
  - reservation_fulfillment
  - reservation_adjustments
- Update shared types and any route contracts needed for these models.
- Keep the new persistence layer in place even if checkout does not consume it yet.

Constraints:
- Migrate existing reservation states conservatively.
- Do not break current cart, payment proof, or vendor review flows while normalizing statuses.
- Update admin and vendor screens that currently reference nonexistent reservation statuses.

Deliverables:
1. Migrations
2. Backend model and association changes
3. Shared type updates
4. Reservation status usage cleanup across backend and frontend
5. Verification summary
```

## 3. Milestone B Prompt

### Skills Needed

- `senior-architect`
- `senior-backend`
- `senior-frontend`
- `impeccable`
- `senior-qa`

### Prompt

```text
Use `senior-architect`, `senior-backend`, `senior-frontend`, `impeccable`, and `senior-qa`.

Implement Milestone B from FULFILLMENT_IMPLEMENTATION_PLAN.md:
- Phase 3: Vendor Fulfillment Settings and Costume Overrides
- Phase 4: Saved Renter Locations
- Phase 5: Fulfillment Selection in Reservation Flow

Requirements:
- Add vendor settings for primary business location, service areas, fulfillment defaults, and optional fixed fees.
- Add per-costume narrowing overrides for outbound and return methods.
- Add renter saved locations with support for creating one during reservation flow and saving it as default.
- Extend reservation creation and checkout flow so each reservation can choose:
  - outbound method
  - return method
  - saved location(s)
  - pickup / delivery / return windows
- Snapshot fulfillment selections and fixed fees onto the reservation.

Frontend requirements:
- Preserve the premium editorial feel already established in the app.
- Avoid generic card-heavy admin patterns.
- Make the per-reservation fulfillment flow feel clear and deliberate, not cramped.

Constraints:
- Costume overrides may narrow vendor defaults but never expand them.
- Delivery-related choices must require a valid saved or newly created location.
- Keep the cart/grouping behavior by vendor intact.

Deliverables:
1. Vendor settings backend and UI
2. Costume override backend and UI
3. Saved renter locations backend and UI
4. Updated reservation/cart flow with fulfillment selection
5. Verification summary
```

## 4. Milestone C Prompt

### Skills Needed

- `senior-architect`
- `senior-backend`
- `senior-frontend`
- `senior-qa`
- `code-reviewer`

### Prompt

```text
Use `senior-architect`, `senior-backend`, `senior-frontend`, `senior-qa`, and `code-reviewer`.

Implement Milestone C from FULFILLMENT_IMPLEMENTATION_PLAN.md:
- Phase 6: Vendor Review and Surcharge Requests
- Phase 7: Fulfillment Operations Lifecycle
- Phase 8: Admin, Reporting, and Earnings Alignment

Requirements:
- Let vendors approve or reject submitted fulfillment details without editing renter-selected methods or time windows.
- Support outside-area surcharge requests per reservation after the vendor reviews the exact address.
- Add the supplemental payment flow for pending reservation adjustments.
- Implement lifecycle transitions from confirmed through outbound, with renter, return, returned, and completed.
- Align renter, vendor, admin, and earnings views with the new lifecycle and surcharge/payment model.

Constraints:
- Do not silently mutate the renter’s original amount after payment proof submission.
- Keep an auditable distinction between:
  - initial reservation payment
  - surcharge request
  - surcharge payment
- Add clear transition guards so lifecycle states cannot skip invalid steps.

Deliverables:
1. Vendor surcharge and review flow
2. Renter surcharge payment flow
3. Fulfillment lifecycle controls and timelines
4. Admin and earnings updates
5. Verification summary and residual risks
```

## 5. Backend-Only Prompt

### Skills Needed

- `senior-architect`
- `senior-backend`
- `senior-qa`

### Prompt

```text
Use `senior-architect`, `senior-backend`, and `senior-qa`.

Implement the backend side of the Delivery / Pickup / Returns feature described in:
- FULFILLMENT_DESIGN.md
- FULFILLMENT_IMPLEMENTATION_PLAN.md

Scope:
- Sequelize migrations
- models and associations
- DTOs and validation schemas
- services
- controllers
- routes
- OpenAPI updates

Focus on:
- reservation lifecycle normalization
- vendor fulfillment settings
- costume narrowing overrides
- user saved locations
- reservation fulfillment snapshots
- reservation adjustments for outside-area surcharges
- supplemental payment handling
- lifecycle transition guards

Deliverables:
1. End-to-end backend implementation for the requested phase
2. Backward-compatible migration notes where needed
3. Tests or verification coverage
4. Brief API summary for frontend integration
```

## 6. Frontend-Only Prompt

### Skills Needed

- `senior-frontend`
- `impeccable`
- `senior-qa`

### Prompt

```text
Use `senior-frontend`, `impeccable`, and `senior-qa`.

Implement the frontend side of the Delivery / Pickup / Returns feature described in:
- FULFILLMENT_DESIGN.md
- FULFILLMENT_IMPLEMENTATION_PLAN.md

Scope:
- renter reservation flow
- cart/checkout fulfillment selection
- saved location UX
- vendor fulfillment settings UI
- costume override UI
- vendor reservation review UI
- renter reservation timeline
- admin and earnings display updates

Design requirements:
- Preserve the project’s premium theatrical and trustworthy visual language.
- Avoid generic admin-card layouts and overuse of modals.
- Make fulfillment choices, fees, service-area exceptions, and status progress legible at a glance.
- Keep mobile usability strong.

Deliverables:
1. UI implementation for the requested phase
2. Updated frontend types and API usage
3. Accessibility-minded interactions and validation states
4. Verification summary
```

## 7. Reservation Lifecycle Prompt

### Skills Needed

- `senior-architect`
- `senior-backend`
- `senior-frontend`

### Prompt

```text
Use `senior-architect`, `senior-backend`, and `senior-frontend`.

Normalize the reservation lifecycle for this repository as the foundation for Delivery / Pickup / Returns.

Use:
- FULFILLMENT_DESIGN.md
- FULFILLMENT_IMPLEMENTATION_PLAN.md

Tasks:
- Replace the current reservation status model with the approved lifecycle
- Remove status drift across backend, renter UI, vendor UI, admin UI, and earnings UI
- Ensure payment approval is no longer treated as operational completion
- Preserve existing flows as much as possible while making the lifecycle explicit

Deliverables:
1. Enum and migration changes
2. Backend transition logic updates
3. Frontend display and filter updates
4. Verification summary
```

## 8. Fulfillment Settings Prompt

### Skills Needed

- `senior-architect`
- `senior-backend`
- `senior-frontend`
- `impeccable`

### Prompt

```text
Use `senior-architect`, `senior-backend`, `senior-frontend`, and `impeccable`.

Implement vendor fulfillment settings and costume narrowing overrides for Delivery / Pickup / Returns.

Requirements:
- Vendor can define:
  - primary business location
  - outbound default mode
  - return default mode
  - optional fixed fees
  - structured service areas
- Costume can optionally narrow outbound and return methods, but cannot expand vendor defaults.

Deliverables:
1. Backend schema and API support
2. Vendor settings screen
3. Costume create/edit override controls
4. Validation for narrowing-only rules
5. Verification summary
```

## 9. Saved Locations Prompt

### Skills Needed

- `senior-backend`
- `senior-frontend`
- `senior-qa`

### Prompt

```text
Use `senior-backend`, `senior-frontend`, and `senior-qa`.

Implement renter saved locations for Delivery / Pickup / Returns.

Requirements:
- Add CRUD support for account-level saved locations
- Support one default location
- Allow a renter to create a new location during reservation flow
- Allow the renter to save that new location as default
- Integrate saved locations into the reservation/checkout fulfillment flow

Deliverables:
1. Backend endpoints and persistence
2. Frontend management UI
3. Checkout integration
4. Verification summary
```

## 10. Surcharge Flow Prompt

### Skills Needed

- `senior-architect`
- `senior-backend`
- `senior-frontend`
- `senior-qa`
- `code-reviewer`

### Prompt

```text
Use `senior-architect`, `senior-backend`, `senior-frontend`, `senior-qa`, and `code-reviewer`.

Implement the outside-area surcharge exception flow for Delivery / Pickup / Returns.

Requirements:
- Vendor reviews the renter’s exact address after initial payment proof submission
- If the address is outside the configured service area, vendor can add an outside-area surcharge per reservation
- Reservation moves into an awaiting-supplemental-payment state
- Renter can see the surcharge request and upload payment proof for only the additional amount
- The system keeps a clear audit trail for:
  - original reservation amount
  - surcharge amount
  - initial payment
  - surcharge payment

Constraint:
- Vendor may not edit the renter’s fulfillment methods or requested time windows

Deliverables:
1. Backend adjustment and supplemental payment support
2. Vendor surcharge request UI
3. Renter surcharge payment UI
4. Verification summary
```

## 11. QA And Review Prompt

### Skills Needed

- `senior-qa`
- `code-reviewer`
- `senior-architect`

### Prompt

```text
Use `senior-qa`, `code-reviewer`, and `senior-architect`.

Review the Delivery / Pickup / Returns implementation in this repository against:
- FULFILLMENT_DESIGN.md
- FULFILLMENT_IMPLEMENTATION_PLAN.md

Focus on:
- status consistency across backend and frontend
- narrowing-only fulfillment override rules
- saved-location correctness
- surcharge exception flow correctness
- lifecycle transition safety
- regression risk in existing cart, payment, vendor review, admin, and earnings flows

Deliverables:
1. Findings first, ordered by severity
2. Any missing tests or risky transitions
3. A short summary of readiness and follow-up work
```
