---
name: SnapCos
description: Modern SaaS UI with premium costume-brand accents
theme:
  mode: "system"
  priority: "light-first but fully supports dark"
colors:
  background: "warm ivory neutral"
  surface: "soft ash neutral"
  text: "ink / charcoal"
  primary-accent: "coral"
  secondary-accent: "muted gold"
  danger: "rust red"
style:
  layout: "structured SaaS"
  brand-layer: "restrained luxury accents"
  density: "medium"
  borders: "crisp 1px"
  shadows: "subtle and rare"
---

# SnapCos Design System

## 1. Core Rule

Build SnapCos like modern SaaS.

Then add premium brand cues with restraint.

This means:
- structured layouts
- predictable modules
- clear CTA hierarchy
- high scanability
- limited decorative behavior

## 2. Visual Positioning

### What it should feel like
- premium
- modern
- reliable
- conversion-focused
- operationally clear

### What it should not feel like
- magazine editorial spread
- luxury marketing site pretending to be software
- generic AI dashboard
- dark neon startup template
- over-decorated fashion brand microsite

## 3. Brand Translation

Use the reference image for brand cues, not layout behavior.

Keep:
- warm ivory base
- coral CTAs and active states
- tiny gold highlights
- refined premium tone
- clean product framing

Reduce:
- oversized editorial composition
- ornamental lines and starbursts as repeated motifs
- decorative density inside product flows
- large serif usage across operational UI

## 4. Theme Strategy

### Light Mode
- default presentation mode
- best for storefront browsing, comparison, and trust
- warm neutrals should make the product feel premium instead of sterile

### Dark Mode
- supported across the app
- should remain calm and product-like
- no glow-heavy dark mode and no neon contrast tricks

## 5. Typography

### Direction
- Use one distinctive display font for hero headlines only
- Use one clean, refined sans-serif for the product UI
- The product UI should be mostly sans-serif
- Serif should be sparse, deliberate, and brand-facing

### Rules
- Do not use `Playfair Display`
- Do not use `DM Sans`
- Do not use gradient text
- Do not use fluid type inside dashboards or dense app UI
- Keep headings high-contrast and body copy easy to scan

### Hierarchy
- **Display:** shopper hero headlines only
- **Page Title:** major screen heading
- **Section Title:** module or page section title
- **Body:** default UI copy
- **Label:** small uppercase or compact metadata

## 6. Color System

### Palette Roles
- **Background:** warm ivory
- **Surface:** pale ash / neutral tint
- **Primary Text:** ink charcoal
- **Secondary Text:** softened neutral
- **Primary Accent:** coral
- **Secondary Accent:** muted gold
- **Danger:** rust red

### Usage Rules
- Coral drives actions, selected states, and key emphasis
- Gold is reserved for tiny premium highlights only
- Most screens should remain mostly neutral
- Do not let coral become the base surface color
- Do not use gold as a major interface fill

## 7. Layout Rules

### Global
- Prefer structured page shells over expressive one-off layouts
- Use consistent max widths and spacing rhythms
- Favor left-aligned content over centered product UI
- Build strong header-content-sidebar relationships

### Storefront
- Hero should be shorter and more functional
- Search/filter layer should be immediate and strong
- Product grid should feel stable and scalable
- Supporting marketing content should not interrupt the main path

### Detail Pages
- Media first
- Booking card second
- Supporting detail third
- Keep the purchase path obvious at all times

### Vendor/Admin
- Sidebar + content shell
- Reusable metric cards
- Reusable table/list patterns
- Reusable alert and status modules
- Strong grouping by urgency and actionability

## 8. Components

### Buttons
- Primary: coral fill
- Secondary: neutral surface
- Tertiary: ghost or text
- Only one primary CTA per section when possible

### Cards
- Use cards where structure helps comprehension
- Do not wrap everything in cards
- Do not nest cards inside cards without a strong reason

### Forms
- Inputs should feel crisp, simple, and product-grade
- Search/filter controls should look stronger than generic admin forms
- Booking and checkout forms should be visually clearer than settings forms

### Tables and Lists
- Vendor/admin should rely more on lists and tables than marketing blocks
- Use spacing, typography, and small accents for hierarchy
- Do not rely on colored stripes or decorative borders

### Status
- Draft, active, flagged, pending, confirmed, canceled, paid, and overdue states must be visually consistent
- Use color plus copy, not color alone

## 9. Motion

- Use motion sparingly
- Focus on page load, hover feedback, and state transition clarity
- No theatrical motion systems
- No bounce or excessive reveal choreography in dashboards

## 10. Absolute Avoids

- Gradient text
- Left accent stripes on cards or alerts
- Glassmorphism
- Purple/cyan AI palettes
- Heavy drop shadows
- Dashboard pages designed like landing pages
- Repeated "fancy" decorative symbols
- Identical giant card grids with no information hierarchy

## 11. Screen Priorities

### Priority A
- Home / discovery
- Costume detail
- Navbar / app shell
- Vendor dashboard shell

### Priority B
- Inventory
- Reservations
- Earnings
- Subscription
- Wishlist
- Customer reservations

### Priority C
- Admin pages
- Auth pages
- Secondary empty states and edge-case screens

## 12. Rollout Plan

### Step 1: Reset the system
- Update tokens
- Update typography rules
- Update CTA hierarchy
- Remove old editorial-first patterns

### Step 2: Redesign the public customer path
- Home
- Search/filter
- Costume detail
- Booking surfaces

### Step 3: Redesign the vendor shell
- Sidebar
- Overview
- Core metrics
- Alerts and task grouping

### Step 4: Redesign vendor workflows
- Inventory
- Reservations
- Earnings
- Subscription

### Step 5: Align admin
- Reuse vendor/system patterns
- Increase density and moderation clarity

### Step 6: Final QA
- Accessibility pass
- Responsive pass
- Dark mode pass
- Visual consistency pass

## 13. Final Decision

Approved design line:

**Modern SaaS structure with restrained premium SnapCos brand accents.**
