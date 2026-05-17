# SnapCos Redesign Implementation Plan

## Goal

Implement the approved direction:

**Modern SaaS structure with restrained premium SnapCos brand accents.**

This plan assumes:
- full web redesign
- high-risk hard reset
- one major redesign branch
- WCAG 2.1 AA baseline
- system-first implementation

## Understanding Summary

- SnapCos should no longer behave like an editorial-first product
- The UI should be SaaS-first, premium second
- Customer pages keep some brand warmth, but must become clearer and more conversion-focused
- Vendor and admin pages should become the strongest expression of the new SaaS direction
- Coral remains the primary action color
- Gold remains a small premium accent only
- The redesign should replace the current mixed visual language with one coherent system

## Non-Goals

- Do not preserve the current editorial-first visual system
- Do not perform a slow incremental migration
- Do not optimize for novelty over usability
- Do not defer accessibility to a follow-up pass
- Do not redesign business logic unless UX structure requires small supporting changes

## Assumptions

- Existing routes and core flows remain intact
- Backend APIs do not need major changes for the redesign
- Most work happens in `apps/web/src`
- Typography will be replaced
- Shared primitives will be rebuilt before page-level polish

## Decision Log

- Plan shape chosen: hybrid phased plan
- Scope chosen: full web redesign
- Risk level chosen: high-risk hard reset
- Accessibility target chosen: WCAG 2.1 AA baseline
- Delivery cadence chosen: one major redesign branch
- Strategy chosen: system-first hard reset
- Final design line chosen: luxury rental platform that behaves like modern SaaS

## Implementation Strategy

Implement in this order:

1. Foundation reset
2. Shared product shells
3. Customer core flow
4. Vendor core flow
5. Admin flow
6. QA, regression, and cleanup

Each phase should leave the app more internally consistent than before. Avoid one-off styling decisions that are not reusable.

---

## Phase 1: Foundation Reset

### Objective

Replace the visual foundation so every downstream screen inherits the new system.

### Primary files

- [apps/web/src/app/globals.css](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/globals.css)
- [apps/web/src/app/layout.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/layout.tsx)
- [apps/web/src/components/ui/button.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/ui/button.tsx)
- [apps/web/src/components/ui/input.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/ui/input.tsx)
- [apps/web/src/components/ui/select.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/ui/select.tsx)
- [apps/web/src/components/ui/card.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/ui/card.tsx)
- [apps/web/src/components/ui/badge.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/ui/badge.tsx)
- [apps/web/src/components/ui/alert.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/ui/alert.tsx)
- [apps/web/src/components/ui/dialog.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/ui/dialog.tsx)

### Work

- Replace current font stack with one new display font and one new UI sans font
- Remove banned visual patterns:
  - gradient text
  - decorative glows as defaults
  - leftover editorial-only helpers
- Define final tokens for:
  - background
  - surface
  - text
  - muted text
  - coral action
  - gold accent
  - danger
  - border
  - ring/focus
- Standardize:
  - spacing
  - border radius
  - border weight
  - elevation
  - hover states
  - disabled states
  - loading states
  - error/success/warning states
- Rebuild button hierarchy:
  - primary
  - secondary
  - tertiary
  - destructive

### Acceptance Criteria

- Shared primitives are visually coherent
- Light mode and dark mode are both stable
- New screens can be built without inventing ad hoc tokens
- Contrast and focus states meet WCAG AA at the primitive level

---

## Phase 2: Shared Product Shells

### Objective

Redesign the structural shells that frame every page.

### Primary files

- [apps/web/src/components/ConditionalNavbar.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/ConditionalNavbar.tsx)
- [apps/web/src/components/Navbar.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/Navbar.tsx)
- [apps/web/src/components/brand/BrandLogo.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/brand/BrandLogo.tsx)
- [apps/web/src/app/vendor/layout.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/vendor/layout.tsx)
- [apps/web/src/app/admin/layout.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/admin/layout.tsx)
- [apps/web/src/components/theme-toggle.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/theme-toggle.tsx)
- [apps/web/src/components/NotificationBell.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/NotificationBell.tsx)
- [apps/web/src/components/CartDrawer.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/CartDrawer.tsx)

### Work

- Redesign public navbar into a compact SaaS storefront header
- Rework logo treatment so it behaves like a product brand mark, not a decorative centerpiece
- Standardize public header action hierarchy:
  - browse
  - auth
  - notifications
  - cart
  - account
- Rebuild vendor shell:
  - sidebar
  - top utility region
  - page header zone
  - content area rhythm
- Rebuild admin shell with:
  - higher density
  - lower ornament
  - stronger operational framing
- Normalize shared utility surfaces:
  - dropdowns
  - drawers
  - toasts
  - menus

### Acceptance Criteria

- Public, vendor, and admin shells feel like one product family
- Customer shell is warmer than vendor/admin
- Vendor/admin shells feel operational and modern
- Responsive behavior preserves critical controls

---

## Phase 3: Customer Core Flow

### Objective

Redesign the primary renter experience to be faster, clearer, and more product-like.

### Primary files

- [apps/web/src/app/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/page.tsx)
- [apps/web/src/components/CostumeCard.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/CostumeCard.tsx)
- [apps/web/src/app/costumes/[id]/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/costumes/[id]/page.tsx)
- [apps/web/src/app/wishlist/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/wishlist/page.tsx)
- [apps/web/src/app/reservations/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/reservations/page.tsx)
- [apps/web/src/components/WishlistButton.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/WishlistButton.tsx)
- [apps/web/src/app/login/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/login/page.tsx)
- [apps/web/src/app/register/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/register/page.tsx)

### Work

#### Home / Discovery
- Shorten hero
- Strengthen search and filters above the fold
- Make category navigation cleaner and more structured
- Make the product grid more stable and reusable
- Reduce campaign-like composition

#### Costume Cards
- Standardize metadata hierarchy
- Clarify price, category, and wishlist behavior
- Reduce decorative treatment that does not improve scanability

#### Costume Detail
- Rebuild hierarchy around booking:
  - gallery
  - summary
  - booking panel
  - trust/reviews
  - supporting detail
- Keep booking card sticky and obvious
- Clarify dates, duration, quantity, and CTA states

#### Wishlist / Reservations / Auth
- Bring into the same structured product system
- Improve empty states and next-step actions
- Reduce stylistic drift between customer utility pages

### Acceptance Criteria

- Main action is obvious immediately on home and detail pages
- Discovery feels premium but conversion-focused
- Booking is clearer than in the current UI
- Utility pages no longer feel visually disconnected from the main product

---

## Phase 4: Vendor Core Flow

### Objective

Make vendor pages the clearest expression of the new SaaS system.

### Primary files

- [apps/web/src/app/vendor/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/vendor/page.tsx)
- [apps/web/src/app/vendor/inventory/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/vendor/inventory/page.tsx)
- [apps/web/src/app/vendor/reservations/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/vendor/reservations/page.tsx)
- [apps/web/src/app/vendor/earnings/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/vendor/earnings/page.tsx)
- [apps/web/src/app/vendor/subscription/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/vendor/subscription/page.tsx)
- [apps/web/src/app/vendor/apply/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/vendor/apply/page.tsx)
- [apps/web/src/components/AddCostumeModal.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/AddCostumeModal.tsx)
- [apps/web/src/components/EditCostumeModal.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/EditCostumeModal.tsx)
- [apps/web/src/components/VendorApplicationPreview.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/components/VendorApplicationPreview.tsx)

### Work

#### Vendor Overview
- Replace landing-page feel with real dashboard hierarchy
- Improve metric grouping, alert priority, and next actions

#### Inventory
- Shift from decorative card presentation to more scalable operational structure
- Clarify status, stock, publish state, and edit actions

#### Reservations
- Prioritize urgency, evidence review, and decision clarity
- Make proof-of-payment handling easier to scan

#### Earnings
- Improve summary-to-detail flow
- Make revenue information easier to parse quickly

#### Subscription / Apply
- Make them feel like product flows, not marketing panels
- Improve trust, clarity, and completion momentum

### Shared Vendor Patterns

- metric cards
- action bars
- filters
- list/table hybrids
- status pills
- alert modules
- empty states

### Acceptance Criteria

- Vendor pages feel significantly more operational than current UI
- Status and urgency are easier to understand at a glance
- Metrics, lists, and actions share a consistent structure

---

## Phase 5: Admin Flow

### Objective

Bring admin into the same system with the highest density and the least ornament.

### Primary files

- [apps/web/src/app/admin/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/admin/page.tsx)
- [apps/web/src/app/admin/inventory/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/admin/inventory/page.tsx)
- [apps/web/src/app/admin/reservations/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/admin/reservations/page.tsx)
- [apps/web/src/app/admin/payments/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/admin/payments/page.tsx)
- [apps/web/src/app/admin/users/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/admin/users/page.tsx)
- [apps/web/src/app/admin/vendors/page.tsx](C:/Users/cayma/Documents/GitHub/costume-rental-platform/apps/web/src/app/admin/vendors/page.tsx)

### Work

- Reduce decorative styling further than vendor
- Increase table/list density where appropriate
- Clarify moderation and escalation states
- Standardize review queues and moderation actions
- Unify system-health presentation across screens

### Acceptance Criteria

- Admin feels like an operations product, not a storefront extension
- Moderation and workflow states are obvious
- Density increases without hurting clarity or accessibility

---

## Phase 6: QA and Release Readiness

### Objective

Stabilize the redesign branch for release.

### Verification Requirements

- Run build and lint after each major phase
- Perform live browser checks on all Priority A screens after each major batch
- Recheck mobile, tablet, and desktop layouts
- Verify keyboard navigation and focus visibility across shared components
- Validate reduced-motion behavior

### Accessibility Gates

- WCAG 2.1 AA contrast for text and controls
- Keyboard-accessible nav, forms, drawers, dialogs, and menus
- Visible focus states across all surfaces
- Color is never the only signal for meaning
- Decorative accents do not interfere with reading order or comprehension

### Regression Checklist

- auth flows
- search and filtering
- booking flow
- cart behavior
- wishlist save/remove
- customer reservations
- vendor listing management
- vendor reservation decisions
- vendor earnings flows
- admin moderation
- theme switching

### Cleanup

- Remove leftover old-theme helper classes
- Remove temporary styling experiments
- Normalize inconsistent copy, labels, and state language
- Confirm docs match shipped UI direction

### Acceptance Criteria

- The app behaves like one coherent system
- Old editorial-first patterns are no longer mixed into core flows
- Customer pages are easier to use
- Vendor/admin pages clearly read as modern SaaS

---

## Suggested Commit Sequence

1. `docs: add redesign implementation plan`
2. `design: reset global tokens and typography`
3. `design: rebuild shared ui primitives`
4. `design: rebuild public and app shells`
5. `design: redesign customer discovery and detail flows`
6. `design: redesign customer utility pages`
7. `design: redesign vendor overview and inventory`
8. `design: redesign vendor reservations earnings subscription`
9. `design: redesign admin operational pages`
10. `design: final qa accessibility and cleanup`

## Priority Order

### Priority A
- home
- costume detail
- navbar / public shell
- vendor shell

### Priority B
- inventory
- vendor reservations
- vendor overview
- earnings
- subscription
- wishlist
- customer reservations

### Priority C
- admin pages
- auth pages
- secondary empty and edge states

## Definition of Done

- New design direction is visible across the full web app
- Shared system is reusable and stable
- Customer, vendor, and admin surfaces feel related but intentionally different in intensity
- Accessibility baseline is met
- The branch is ready for coordinated review and release
