# SnapCos Design Context

## Design Context

### Users
- **Renters:** Enthusiasts, cosplayers, and event-goers. They browse a dense marketplace with filters, search, and sort — then book rentals. They need fast discovery, clear pricing, and a theatrical but utility-forward experience.
- **Vendors:** Independent costume owners and small businesses. They manage listings, subscriptions, and reservations in a dashboard that feels premium and on-brand without sacrificing operational clarity.
- **Admins:** Platform operators who review vendors, moderate inventory, and oversee reservations in a refined console matching the same surface language.

### Brand Personality
**Playful, Theatrical, Trustworthy.**
SnapCos balances the functional robustness of a modern marketplace with the energetic personality of a fashion-forward stage brand. It should feel "snap-ready" and intentional — never generic.

### Aesthetic Direction
- **Visual Tone:** Playful theatrical brand (coral, gold, curtain black) wrapped in a **utility-forward marketplace layout**.
- **North Star:** **"Snap Into Character"** — derived from the logo (coral dress form, snapping hand, gold sparkle).
- **Storefront Layout:** Two-row top bar (logo + pill search + utilities, then category nav), left filter sidebar, results toolbar (count + sort + grid/list), removable filter chips, dense listing card grid. Browse state is URL-driven.
- **Dashboard Layout:** Rounded-xl card panels on muted page backgrounds; coral pill active nav in vendor/admin sidebars. Inventory reuses marketplace toolbar and card grid patterns.
- **Theme:** **System/Both** — warm canvas (light) / dark stage (dark).
- **Key Elements:** Spotlight Coral CTAs, Stage Gold accents (sparingly), Fraunces display + DM Sans body, sparkle motifs, coral-tinted hover shadows, `0.75rem` radius, `rounded-xl` dashboard surfaces.
- **Data Honesty:** Listing cards show real API fields only (price, name, category, size, theme). No fabricated ratings, sold counts, or discount prices.

### Design Principles
1. **Color With Purpose:** Coral drives action; gold sparkles premium moments; black structures the stage. Color is encouraged, not banished.
2. **Discovery-First Browse:** Renters filter, sort, and switch views quickly. Shareable URL state keeps filtered views bookmarkable.
3. **Content-Forward Cards:** Costume photography is the visual anchor; metadata and pricing are scannable beneath.
4. **Web-First Consistency:** Visual language is defined for the Next.js web platform (`apps/web`). No separate mobile app in this repo.
5. **SaaS-Grade Precision:** Vendor and admin workflows remain responsive and stateful — approvals, listing states, and reservation actions must read clearly.

### Marketplace UX Notes
- **Server-backed filters:** `q`, `category`, `size`, `gender`, `theme`, `sort`, `page`.
- **Client-side refinements:** price range (applied to loaded page results); facet options for size/gender/theme derived from current results.
- **View modes:** grid (default) and list layouts on `CostumeCard`.
- **Mobile:** category nav and pill search available in navbar; filter sidebar is desktop-only (`lg:block`). Mobile filter drawer is a future enhancement.
