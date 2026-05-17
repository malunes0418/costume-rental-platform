# SnapCos Product Direction

## Direction

SnapCos should feel like a modern SaaS product with premium fashion brand cues.

- **Primary identity:** clear, structured, high-trust SaaS
- **Secondary identity:** luxury costume brand
- **Visual balance:** 80% product clarity, 20% brand expression
- **Reference mode:** conversion-focused commerce plus operational dashboards

This is not an editorial-first experience anymore. The product should stop behaving like a magazine layout and start behaving like a fast, legible, scalable software platform.

## Users

### Renters
- Need to discover costumes quickly
- Need to understand price, dates, fit, trust signals, and booking steps immediately
- Need the storefront to feel premium without slowing down decisions

### Vendors
- Need a calm operational workspace
- Need fast access to inventory, reservations, earnings, and subscription status
- Need dashboards that feel trustworthy, structured, and easy to scan

### Admins
- Need the clearest interface of all
- Need moderation, visibility, and system health states to be obvious

## Product Principles

1. **Clarity beats drama**
Every major screen should be scannable in under 5 seconds.

2. **Brand is an accent, not the layout**
Coral and gold should guide attention, not dominate every surface.

3. **Commerce flows must feel immediate**
Search, filtering, product detail, and booking must look simpler and faster than they do now.

4. **Operational views must feel modern SaaS**
Vendor and admin experiences should be modular, stable, and low-noise.

5. **One system, different intensities**
Customer pages can carry more brand expression. Vendor/admin pages should be more restrained.

## Non-Goals

- Do not build an editorial magazine UI
- Do not rely on decorative flourishes to create quality
- Do not make dashboards feel like storefronts
- Do not make every page visually "special"
- Do not optimize for visual novelty over task completion

## Experience Targets By Surface

### 1. Customer Discovery
- Strong search and filter bar above the fold
- Clean category navigation
- Structured product grid with consistent cards
- Premium hero, but shorter and more practical than a campaign landing page
- Trust/value props integrated without turning into a poster layout

### 2. Costume Detail
- Image gallery first
- Booking card always clear and prominent
- Price, duration, date selection, and CTA visible without hunting
- Reviews and trust signals organized into structured sections
- Supporting content below the fold, not competing with booking

### 3. Vendor Dashboard
- SaaS-first shell with sidebar and consistent modules
- Clear metrics, alerts, reservations, and inventory state
- Better grouping by urgency and actionability
- Less decorative typography, more information density

### 4. Admin
- Most minimal version of the system
- Strong hierarchy, system status visibility, and moderation controls
- Near-zero decorative brand behavior outside small accents

## Success Criteria

- A new user can identify the main action on every page immediately
- The storefront feels premium without feeling slow or precious
- Vendor/admin pages feel closer to modern SaaS than luxury marketing
- The UI can support more screens without redesigning the visual language each time
- SnapCos still feels branded even when pages are mostly neutral

## Implementation Plan

### Phase 1: Foundation
- Reset the design direction across docs and tokens
- Replace current "editorial-first" framing with "modern SaaS with premium brand accents"
- Define shared color, spacing, border, radius, and elevation rules
- Remove visual patterns that feel decorative but do not improve usability

### Phase 2: Shared System
- Standardize app shell, page header, section header, cards, forms, tables, filters, and CTA hierarchy
- Create customer, vendor, and admin intensity rules for brand usage
- Tighten typography hierarchy for readability and reuse
- Normalize empty, loading, error, success, and warning states

### Phase 3: Customer Core Flow
- Redesign home/discovery
- Redesign search/filter rhythm
- Redesign costume detail and booking panel
- Make wishlist, reservations, and login/register consistent with the new structure

### Phase 4: Vendor Core Flow
- Redesign vendor shell and overview
- Redesign inventory, reservations, earnings, and subscription pages
- Improve scanability, action grouping, and status language

### Phase 5: Admin Core Flow
- Bring admin screens to the same system
- Prioritize moderation clarity and operational density
- Reduce unnecessary stylistic variance across admin pages

### Phase 6: Final Polish
- Refine motion, responsive behavior, and spacing rhythm
- Audit for visual consistency and accessibility
- Remove leftover old-theme patterns

## Current Design Decision

Approved direction:

**"A luxury rental platform that finally behaves like modern SaaS."**
