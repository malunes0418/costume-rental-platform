# Product To Do

## High Priority

- [x] Fix payment approval ownership: pending payment proofs must only be approved by the intended authorized reviewer, and vendor reservation actions must not implicitly approve unreviewed payments.
- [x] Stabilize the booking and fulfillment flow, including delivery handling, payment state transitions, surcharge handling, and evidence-based handoff lifecycle transitions (see `FULFILLMENT_DESIGN.md` and migration `20260612000000-handoff-lifecycle-overhaul.js`).
- [ ] Select and integrate payment methods suitable for local Philippine payments, including the required gateway and payment authorization approach.
- [x] Add backend unit coverage for lifecycle rules, fulfillment domain helpers, and payment guard helpers (Vitest in `apps/backend`). E2E/browser coverage for checkout and handoff flows remains open.

## Product Experience Priority

- [ ] Add reservation chat interfaces for renters and vendors using the existing reservation-scoped messaging API.
- [ ] Define chat follow-up requirements, including unread indicators, notifications, moderation, and whether realtime delivery is required.
- [ ] Expand the existing vendor earnings and admin dashboard surfaces with defined missing metrics, reporting periods, filters, and data validation.
- [ ] Simplify the key user journeys first: renter checkout/payment submission, vendor reservation review, and mobile usability.
- [ ] Transition the refined UI toward a lively modern SaaS design using Impeccable after the core journeys are clear and stable.

## Medium Priority

- [ ] Integrate a third-party KYC provider for vendor verification.
- [ ] Automate damage surcharge collection when a rented costume is returned damaged.

### Payment-Dependent Feature

Automated damage surcharge collection must be implemented only after a stored or payment-authorized payment method is available. The current manual proof/payment-request flow is unreliable after return because a customer may not complete an additional charge request.

## Low Priority

- [ ] Continue visual and interaction polish after the prioritized journeys have acceptance criteria and reliable coverage.
