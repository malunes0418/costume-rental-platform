# Product To Do

## High Priority

- [x] Fix payment approval ownership: pending payment proofs must only be approved by the intended authorized reviewer, and vendor reservation actions must not implicitly approve unreviewed payments.
- [x] Stabilize the booking and fulfillment flow, including delivery handling, payment state transitions, surcharge handling, and evidence-based handoff lifecycle transitions (see `FULFILLMENT_DESIGN.md` and migration `20260612000000-handoff-lifecycle-overhaul.js`).
- [x] Add Lalamove fulfillment integration and Places address autocomplete for delivery/pickup locations.
- [x] Add cart-based reservation flow with vendor payment methods and fulfillment preferences.
- [ ] Select and integrate payment methods suitable for local Philippine payments, including the required gateway and payment authorization approach.
- [x] Add backend unit coverage for lifecycle rules, fulfillment domain helpers, and payment guard helpers (Vitest in `apps/backend`). E2E/browser coverage for checkout and handoff flows remains open.

## Product Experience Priority

- [x] Redesign marketplace storefront with brand system (filters, toolbar, chips, card grid) and theatrical loading stages.
- [x] Align marketplace loading skeletons with real card/filter layout (count, price row, facet placeholders) and fix category filter values to match stored catalog categories.
- [x] Redesign account, reservations, notifications, and wishlist surfaces with backend account APIs.
- [x] Redesign auth pages with stage theming.
- [ ] Add reservation chat interfaces for renters and vendors using the existing reservation-scoped messaging API.
- [ ] Define chat follow-up requirements, including unread indicators, notifications, moderation, and whether realtime delivery is required.
- [ ] Expand the existing vendor earnings and admin dashboard surfaces with defined missing metrics, reporting periods, filters, and data validation.
- [ ] Simplify remaining key journeys: mobile filter/browse usability, and further checkout/payment submission polish.
- [x] Transition the refined UI toward a lively modern SaaS design using Impeccable (marketplace, auth, account, and loading states landed; continue polish under Low Priority).

## Medium Priority

- [ ] Make marketplace category filtering robust: replace hardcoded frontend category values with a shared taxonomy (or API-driven facets) so nav/filters stay in sync with stored `costume.category` strings and new categories don’t silently break filtering.
- [ ] Integrate a third-party KYC provider for vendor verification.
- [ ] Automate damage surcharge collection when a rented costume is returned damaged.

### Payment-Dependent Feature

Automated damage surcharge collection must be implemented only after a stored or payment-authorized payment method is available. The current manual proof/payment-request flow is unreliable after return because a customer may not complete an additional charge request.

## Low Priority

- [ ] Continue visual and interaction polish after the prioritized journeys have acceptance criteria and reliable coverage.
- [ ] Mobile filter drawer for marketplace browse (sidebar is desktop-only today).
