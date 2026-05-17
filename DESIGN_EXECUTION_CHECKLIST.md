# SnapCos Redesign Execution Checklist

Use this alongside [DESIGN_IMPLEMENTATION_PLAN.md](C:/Users/cayma/Documents/GitHub/costume-rental-platform/DESIGN_IMPLEMENTATION_PLAN.md).

## Working Rules

- Complete phases in order unless a blocker forces resequencing
- Do not introduce one-off visual patterns outside the approved system
- Keep accessibility checks inside each phase, not at the end only
- Update this checklist as tasks are completed or descoped

## Phase 0: Branch and Baseline

Current note:
`codex/snapcos-redesign-foundation` is active. `apps/web` build passes, localhost responds, and lint still fails because of pre-existing `no-explicit-any` / image warnings outside the Phase 1 foundation files. Baseline screenshots are still pending because local browser capture was not available in this thread.

### Setup
- [x] Create the redesign branch
- [ ] Freeze unrelated visual changes during the redesign
- [ ] Capture before screenshots for Priority A screens
- [ ] Confirm current build, lint, and dev server all run successfully
- [x] Log known UI debt that should be removed during the redesign

### Baseline review
- [x] Review current `apps/web/src/app/globals.css`
- [x] Review current shared UI primitives in `apps/web/src/components/ui`
- [x] Review current public shell, vendor shell, and admin shell
- [x] Review current customer, vendor, and admin Priority A pages

### Exit criteria
- [ ] Baseline screenshots saved
- [x] Branch ready for coordinated redesign work

## Phase 1: Foundation Reset

### Typography
- [x] Choose one new display font for limited brand-facing headings
- [x] Choose one new sans-serif UI font for product surfaces
- [x] Remove `Playfair Display` usage from the core system
- [x] Remove `DM Sans` usage from the core system
- [x] Update font loading in `apps/web/src/app/layout.tsx`
- [x] Update font tokens in `apps/web/src/app/globals.css`

### Tokens
- [x] Define final light-mode color tokens
- [x] Define final dark-mode color tokens
- [x] Define final text, muted text, border, surface, and danger tokens
- [x] Define coral as the primary action token
- [x] Define gold as a small premium accent token
- [x] Remove legacy decorative token usage that does not fit the new direction

### Core styling rules
- [x] Standardize radius scale
- [x] Standardize border weight and border behavior
- [x] Standardize spacing rhythm
- [x] Standardize focus ring behavior
- [x] Standardize subtle shadow usage
- [x] Remove gradient text utilities
- [x] Remove decorative global helpers that conflict with the approved direction

### Shared primitives
- [x] Rebuild button hierarchy in `button.tsx`
- [x] Normalize inputs in `input.tsx`
- [x] Normalize selects in `select.tsx`
- [x] Normalize cards in `card.tsx`
- [x] Normalize badges in `badge.tsx`
- [x] Normalize alerts in `alert.tsx`
- [x] Normalize dialog styling in `dialog.tsx`

### Validation
- [ ] Check contrast at token level
- [ ] Check visible focus states
- [x] Run build
- [ ] Run lint

### Exit criteria
- [x] Shared primitive set is stable
- [x] New pages can be built without ad hoc styling

## Phase 2: Shared Product Shells

Current note:
Phase 2 shell implementation is in place across the public header, vendor shell, admin shell, shared shell header structure, logo treatment, dropdowns, notifications, cart drawer, and toasts. `apps/web` build passes. Lint still fails because of the same pre-existing repo-wide `no-explicit-any`, `img`, and unused-variable issues outside the shell work. Live browser-based responsive and keyboard verification are still pending in this thread.

### Public shell
- [x] Rebuild `Navbar.tsx` into a cleaner SaaS storefront header
- [x] Reassess nav link hierarchy and spacing
- [x] Rework sign-in, sign-up, account, notification, and cart actions
- [x] Make mobile header behavior consistent with desktop priorities
- [x] Confirm `ConditionalNavbar.tsx` still suppresses shells correctly

### Brand treatment
- [x] Rework `BrandLogo.tsx` presentation to be product-grade, not decorative-first
- [x] Confirm logo works in light and dark themes
- [x] Confirm logo usage rules across public, vendor, and admin shells

### Vendor shell
- [x] Rebuild `app/vendor/layout.tsx`
- [x] Standardize vendor sidebar structure
- [x] Standardize vendor top utility area
- [x] Add reusable page-header structure for vendor screens

### Admin shell
- [x] Rebuild `app/admin/layout.tsx`
- [x] Increase density relative to vendor shell
- [x] Reduce ornament relative to vendor shell
- [x] Standardize reusable admin page-header structure

### Shared utility surfaces
- [x] Normalize theme toggle styling
- [x] Normalize notification surface styling
- [x] Normalize cart drawer styling
- [x] Normalize shared dropdown/menu behavior

### Validation
- [ ] Test shell responsiveness on mobile, tablet, desktop
- [ ] Verify keyboard navigation across shell controls
- [x] Run build
- [ ] Run lint

### Exit criteria
- [x] Public, vendor, and admin shells feel like one system
- [x] Page-header pattern is reusable across routes

## Phase 3: Customer Core Flow

Current note:
Phase 3 customer flow implementation is in place across home/discovery, costume cards, costume detail, wishlist, customer reservations, login, and register. `apps/web` build passes. Lint still fails because of the existing repo-wide `no-explicit-any` errors in admin/vendor/shared files, and the current customer slice still has `no-img-element` warnings in `CostumeCard.tsx`, `app/wishlist/page.tsx`, and `app/reservations/page.tsx`. Live browser-based responsive and keyboard verification for the updated customer flow is still pending in this thread.

### Home / discovery
- [x] Redesign `app/page.tsx`
- [x] Shorten hero
- [x] Strengthen search and filters above the fold
- [x] Standardize category chip behavior
- [x] Redesign product grid structure
- [x] Reduce campaign-style layout behavior

### Costume cards
- [x] Redesign `CostumeCard.tsx`
- [x] Clarify category, name, price, and wishlist hierarchy
- [x] Make hover states useful, not decorative
- [x] Ensure card behavior scales across many results

### Costume detail
- [x] Redesign `app/costumes/[id]/page.tsx`
- [x] Make gallery hierarchy clearer
- [x] Make booking card stronger and more obvious
- [x] Clarify quantity, dates, duration, and CTA sequence
- [x] Restructure supporting content below booking
- [x] Tighten review and trust-signal layout

### Customer utility pages
- [x] Redesign `app/wishlist/page.tsx`
- [x] Redesign `app/reservations/page.tsx`
- [x] Redesign `app/login/page.tsx`
- [x] Redesign `app/register/page.tsx`
- [x] Normalize empty states and next-step actions

### Validation
- [ ] Verify home page main CTA is obvious immediately
- [ ] Verify costume detail booking path is obvious immediately
- [ ] Verify customer utility pages match the same system
- [ ] Test customer flow on mobile, tablet, desktop
- [x] Run build
- [ ] Run lint

### Exit criteria
- [x] Customer flow feels faster and clearer than current UI
- [x] Premium brand layer remains visible without dominating the layout

## Phase 4: Vendor Core Flow

Current note:
Phase 4 vendor implementation is in place across vendor overview, inventory, reservations, earnings, subscription, the apply flow, `AddCostumeModal.tsx`, `EditCostumeModal.tsx`, and `VendorApplicationPreview.tsx`. `apps/web` build passes. Lint still fails because of the existing repo-wide `no-explicit-any` errors in admin and shared utility files, while the current vendor slice now mainly reports `no-img-element` warnings in `app/vendor/inventory/page.tsx`, `app/vendor/reservations/page.tsx`, and `components/vendor/VendorCostumeFormFields.tsx`. Live browser-based responsive and keyboard verification for the redesigned vendor flow is still pending in this thread.

### Vendor overview
- [x] Redesign `app/vendor/page.tsx`
- [x] Replace landing-page feel with dashboard hierarchy
- [x] Improve metrics, alerts, and next-action grouping

### Inventory
- [x] Redesign `app/vendor/inventory/page.tsx`
- [x] Improve status hierarchy
- [x] Improve edit/publish/unpublish affordances
- [x] Decide where cards vs tables/lists are actually appropriate

### Reservations
- [x] Redesign `app/vendor/reservations/page.tsx`
- [x] Make urgency and evidence review easier to scan
- [x] Clarify confirm/decline/review actions

### Earnings
- [x] Redesign `app/vendor/earnings/page.tsx`
- [x] Improve summary-to-detail structure
- [x] Improve readability of revenue and payout information

### Subscription and apply
- [x] Redesign `app/vendor/subscription/page.tsx`
- [x] Redesign `app/vendor/apply/page.tsx`
- [x] Improve trust, clarity, and completion flow

### Supporting vendor components
- [x] Redesign `AddCostumeModal.tsx` or replace modal flow if a better pattern is justified
- [x] Redesign `EditCostumeModal.tsx` or replace modal flow if a better pattern is justified
- [x] Redesign `VendorApplicationPreview.tsx`

### Validation
- [ ] Verify overview reads like a real SaaS dashboard
- [ ] Verify inventory and reservations are easier to scan than before
- [ ] Verify status language is consistent
- [x] Run build
- [ ] Run lint

### Exit criteria
- [x] Vendor area is the clearest SaaS expression in the app
- [x] Shared operational patterns are reusable

## Phase 5: Admin Flow

Current note:
Phase 5 admin implementation is in place across admin overview, inventory, reservations, payments, users, vendors, and the shared admin navigation/data layer. `apps/web` build passes. Repo-wide lint still fails because of pre-existing non-admin `no-explicit-any`, `img`, and unused-variable issues in shared/customer/vendor files, while the focused admin slice lint (`src/app/admin`, `src/components/admin`, `src/lib/admin.ts`) passes cleanly. Live browser-based responsive and keyboard verification for the redesigned admin flow is still pending in this thread.

### Core admin pages
- [x] Redesign `app/admin/page.tsx`
- [x] Redesign `app/admin/inventory/page.tsx`
- [x] Redesign `app/admin/reservations/page.tsx`
- [x] Redesign `app/admin/payments/page.tsx`
- [x] Redesign `app/admin/users/page.tsx`
- [x] Redesign `app/admin/vendors/page.tsx`

### Admin-specific goals
- [x] Increase density appropriately
- [x] Reduce ornament further than vendor
- [x] Clarify moderation states and escalation paths
- [x] Normalize table/list and action patterns

### Validation
- [ ] Verify admin no longer feels like a storefront extension
- [x] Verify moderation actions are obvious
- [ ] Verify keyboard and focus behavior in dense admin surfaces
- [x] Run build
- [ ] Run lint

### Exit criteria
- [x] Admin feels operational, coherent, and lower-noise than vendor

## Phase 6: Cross-Cutting Cleanup

### Visual consistency
- [ ] Remove leftover old-theme classes
- [ ] Remove unused helper utilities
- [ ] Normalize inconsistent copy labels and headings
- [ ] Normalize badge and status naming across the app

### Accessibility
- [ ] Audit text contrast
- [ ] Audit controls contrast
- [ ] Audit focus states
- [ ] Audit keyboard traversal
- [ ] Audit reduced-motion behavior
- [ ] Audit color-only meaning

### Responsive
- [ ] Review all Priority A screens on mobile
- [ ] Review all Priority A screens on tablet
- [ ] Review all Priority A screens on desktop
- [ ] Fix layout breaks or cramped action areas

### Regression
- [ ] Test auth
- [ ] Test search/filtering
- [ ] Test booking flow
- [ ] Test cart
- [ ] Test wishlist
- [ ] Test customer reservations
- [ ] Test vendor listing management
- [ ] Test vendor reservation review
- [ ] Test vendor earnings
- [ ] Test admin moderation
- [ ] Test theme switching

### Exit criteria
- [ ] Visual system is consistent across the app
- [ ] Accessibility baseline is met
- [ ] Major regressions are resolved

## Priority Screen Review Checklist

### Priority A
- [ ] Home / discovery
- [ ] Costume detail
- [ ] Navbar / public shell
- [ ] Vendor shell

### Priority B
- [ ] Inventory
- [ ] Vendor reservations
- [ ] Vendor overview
- [ ] Earnings
- [ ] Subscription
- [ ] Wishlist
- [ ] Customer reservations

### Priority C
- [ ] Admin pages
- [ ] Auth pages
- [ ] Secondary empty states
- [ ] Edge-case screens

## Suggested Commit Sequence

- [ ] `docs: add redesign implementation plan`
- [ ] `design: reset global tokens and typography`
- [ ] `design: rebuild shared ui primitives`
- [x] `design: rebuild public and app shells`
- [x] `design: redesign customer discovery and detail flows`
- [x] `design: redesign customer utility pages`
- [x] `design: redesign vendor overview and inventory`
- [x] `design: redesign vendor reservations earnings subscription`
- [x] `design: redesign admin operational pages`
- [ ] `design: final qa accessibility and cleanup`

## Release Readiness

- [x] Build passes
- [ ] Lint passes
- [ ] Priority A screens visually approved
- [ ] Accessibility baseline verified
- [ ] Responsive review complete
- [ ] Old editorial-first styling removed from core flows
- [ ] Docs reflect shipped direction
