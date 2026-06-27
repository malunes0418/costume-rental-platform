---
name: SnapCos
description: Playful theatrical costume rental marketplace — coral, gold, and curtain black with utility-forward marketplace layout
colors:
  spotlight-coral: "oklch(0.68 0.16 28)"
  stage-gold: "oklch(0.80 0.12 80)"
  curtain-black: "oklch(0.17 0.02 30)"
  warm-canvas: "oklch(0.98 0.012 60)"
  destructive-crimson: "oklch(0.53 0.21 16)"
typography:
  display:
    fontFamily: "\"Fraunces\", Georgia, serif"
  body:
    fontFamily: "\"DM Sans\", system-ui, sans-serif"
rounded:
  md: "0.75rem"
  xl: "0.75rem"
layout:
  marketplace-shell: "bg-muted/40 min-h-screen"
  marketplace-content: "max-w-[1400px] mx-auto px-4 md:px-6"
  page-bg: "color-mix(in oklch, muted 40%, background)"
components:
  button-primary:
    backgroundColor: "{colors.spotlight-coral}"
    textColor: "oklch(0.99 0.01 60)"
    rounded: "{rounded.md}"
  button-gold:
    backgroundColor: "{colors.stage-gold}"
    textColor: "{colors.curtain-black}"
    rounded: "{rounded.md}"
---

# Design System: SnapCos

## 1. Overview

**Creative North Star: "Snap Into Character"**

SnapCos is a playful, theatrical costume rental marketplace. The visual identity is drawn directly from the logo: a coral dress form, a black snapping hand, and gold sparkles. Color is central — not banished. The interface feels fashion-forward, energetic, and stage-ready while remaining clear and trustworthy for bookings and vendor workflows.

The storefront uses a **utility-forward marketplace layout**: a two-row top bar with pill search, a left faceted filter sidebar, a results toolbar with sort and view toggle, removable filter chips, and a dense product card grid. Vendor and admin areas share the same surface language (rounded-xl panels, muted page backgrounds, coral active states) without copying the full browse layout.

**Key Characteristics:**
- Spotlight Coral for hero moments, primary actions, and active controls
- Stage Gold for premium accents and sparkle highlights (used sparingly)
- Curtain Black for structure, typography, and contrast
- Soft coral-tinted shadows for elevation on hover
- Fraunces display type for theatrical headlines
- Dense marketplace browse with URL-driven filters
- Real data only on listing cards — no fabricated ratings or sold counts

## 2. Colors

### Brand
- **Spotlight Coral** `oklch(0.68 0.16 28)` — maps to `--primary` / `--brand-coral`. Primary actions, active states, focus rings. Hover: `oklch(0.60 0.17 28)`.
- **Stage Gold** `oklch(0.80 0.12 80)` — maps to `--accent` / `--brand-gold`. Premium badges, sparkle accents. Use sparingly.
- **Curtain Black** `oklch(0.17 0.02 30)` — maps to `--foreground` / `--brand-ink`. Body text and structural ink.

### Surfaces
- **Warm Canvas** `oklch(0.98 0.012 60)` — light-mode page background (`--background`).
- **Dark Stage** `oklch(0.16 0.015 30)` — dark-mode page background.
- **Muted page wash** — `bg-muted/40` or `.page-bg` for marketplace shell and dashboard pages.
- **Panels** — `--card` on `rounded-xl` bordered surfaces for sidebars, toolbars, and cards.

### Semantic
- **Destructive Crimson** `oklch(0.53 0.21 16)` — errors and destructive actions only. Must never be confused with brand coral.

### Named Rules
**The Spotlight Rule.** Coral owns primary actions and active navigation. Gold accents sparkle moments — never compete with coral on the same control.

## 3. Typography

**Display Font:** Fraunces (via `next/font`, `--font-display`) — playful high-contrast theatrical serif
**Body Font:** DM Sans (via `next/font`, `--font-sans`) — clean geometric sans for UI density

### Hierarchy
- **Display (h1–h4):** Fraunces — page titles, card names, pricing emphasis, compact brand strip headings.
- **Body:** DM Sans — descriptions, form labels, table data, filter labels.
- **Label:** Uppercase tracking (`tracking-widest`, `text-xs`) for metadata, filter section headers, and microcopy.

### Named Rules
**The Snap Contrast Rule.** Headlines use Fraunces at bold weights; body stays in DM Sans. Do not mix display font in dense data tables.

## 4. Layout Patterns

### 4.1 Marketplace storefront (`/`)

```
┌─────────────────────────────────────────────────────────┐
│ Row 1: Logo │ pill search + Search btn │ bell cart user  │
├─────────────────────────────────────────────────────────┤
│ Row 2: All │ Superhero │ Halloween │ … (coral underline)│
├──────────┬──────────────────────────────────────────────┤
│ Filter   │ Results toolbar (count │ sort │ grid/list)   │
│ sidebar  │ Filter chips (removable pills + Clear all)   │
│ (sticky) │ Card grid or list + pagination               │
└──────────┴──────────────────────────────────────────────┘
```

- **Shell:** `.marketplace-shell` (`bg-muted/40`, `--navbar-height: 7.5rem`).
- **Content:** `.marketplace-content` (`max-w-[1400px]`, horizontal padding).
- **URL state:** `q`, `category`, `size`, `gender`, `theme`, `sort`, `view`, `page`, `priceMin`, `priceMax`.
- **Server filters:** `q`, `category`, `size`, `gender`, `theme`, `sort`, `page` via `CostumeListQuery`.
- **Client filters:** price range applied to loaded page results; facet options (size/gender/theme) derived from current results.
- **Components:** `FilterSidebar`, `ResultsToolbar`, `FilterChips`, `RangeSlider` in `components/marketplace/`.
- **Navbar:** two-row bar on storefront routes; suppressed on `/admin`, `/vendor`, `/oauth` via `ConditionalNavbar`.

### 4.2 Vendor & admin dashboards

- **Page background:** `.page-bg` or `bg-muted/40`.
- **Sidebar:** refined left nav with coral-filled pill active state (`bg-primary text-primary-foreground`, `rounded-lg`).
- **Surfaces:** `rounded-xl border border-border bg-card` for KPI blocks, tables, and panels.
- **Inventory:** reuses `ResultsToolbar` and filter chips; dense card grid for listings.
- **No full marketplace sidebar** on operational pages — layout is dashboard-first.

### 4.3 Listing cards (`CostumeCard`)

- **Grid variant:** image (`aspect-[3/4]`), coral price, 2-line title, category/size/theme meta, circular coral action button, wishlist/own badge.
- **List variant:** horizontal row with thumbnail, meta, price, action.
- **Real data only:** price, name, category, size, theme — no fake ratings, sold counts, or strikethrough sale prices.

## 5. Elevation

Surfaces are warm and approachable at rest. Coral-tinted shadows (`.shadow-coral`, `.shadow-coral-hover`) appear on hover for cards and interactive containers.

### Named Rules
**The Warm Depth Rule.** Elevation responds to interaction: hover lifts with `oklch(0.68 0.16 28 / 0.12)` tinted shadow.

## 6. Motifs & Motion

- **Sparkle:** `Sparkle` component — 4-point gold star (`text-brand-gold`, `animate-sparkle`) beside brand moments.
- **Snap:** Button hover scale (`hover:scale-[1.02]`), press scale (`active:scale-[0.97]`).
- **Keyframes:** `sparkle`, `snap`, `fadeUp` with `--ease-out-expo` / `--dur-slow`.

## 7. Components

### Buttons (`components/ui/button.tsx`)
- **Primary:** `bg-primary` (coral), snap hover scale.
- **Gold:** `variant="gold"` — Stage Gold fill for premium CTAs.
- **Outline / Ghost / Destructive:** standard shadcn variants with coral focus ring.

### Cards
- **Corner:** `rounded-xl` (`--radius: 0.75rem`).
- **Shadow:** `.shadow-coral-hover` on interactive listing cards.
- **Border:** `border-border`.

### Inputs
- **Pill search:** `rounded-full border bg-muted/50`, coral focus-within border.
- **Focus:** coral ring (`--ring` = coral).

### Marketplace primitives
| Component | Purpose |
|-----------|---------|
| `FilterSidebar` | Category, Size, Gender, Theme checkboxes + price min/max + `RangeSlider` |
| `ResultsToolbar` | Result count, sort select, grid/list toggle |
| `FilterChips` | Removable active-filter pills + "Clear all" |
| `RangeSlider` | Dual-handle price slider |
| `constants.ts` | Shared sort options and category list |

## 8. Do's and Don'ts

### Do:
- **Do** use Spotlight Coral for primary buttons, active nav, filter chips, and focus states.
- **Do** use Stage Gold sparingly for sparkle accents and premium badges.
- **Do** use Fraunces for h1–h4 and display moments.
- **Do** use the marketplace shell pattern on browse surfaces.
- **Do** drive browse state from URL search params for shareable filtered views.
- **Do** show only real listing data on cards.

### Don't:
- **Don't** use monochrome `bg-foreground text-background` for primary actions — use coral tokens.
- **Don't** fabricate ratings, sold counts, or sale/discount prices on listing cards.
- **Don't** overuse gold — it should sparkle, not dominate.
- **Don't** revert to flat colorless editorial minimalism or tall hero-only browse pages.
- **Don't** use glassmorphism as a default treatment.
