# Delivery-Only Renter Booking — Design Spec

**Date:** 2026-06-28  
**Status:** Approved  
**Phase:** 1 (renter UI only)

---

## Understanding Summary

- **What:** Simplify the costume product-page booking flow to delivery-only full service (vendor delivers to renter, vendor picks up at return).
- **Why:** Focus on one fulfillment model before the deferred cart-wide checkout redesign.
- **Who:** Logged-in renters booking costumes from vendor listings.
- **Buttons:** "Add to cart" and "Reserve now" open the **same** delivery-only wizard; only difference is cart drawer opens after "Reserve now".
- **Scope:** Renter-facing UI only — no backend enforcement changes in phase 1.
- **Deferred:** Cart-wide checkout (dates per costume + batched fulfillment per vendor), API pickup rejection, marketplace filtering of pickup-only listings.

---

## Assumptions

- API payload uses existing fields: `outbound_method: DELIVERY`, `return_method: DELIVERY`, `use_same_location_for_return: true`.
- Return pickup always uses the same address as delivery in phase 1.
- Pickup remains in the data model; it is hidden from the renter UI.
- Costumes whose vendor config does not allow delivery may fail at submit via existing API validation; UI shows the error message.
- Quick-add flow (dates-only + pickup defaults) is removed.
- Auth gate remains: guests cannot open the wizard.

---

## Non-Goals (Phase 1)

- Per-vendor batched fulfillment at checkout
- Incomplete cart lines (costume without dates/fulfillment)
- Hiding pickup-only listings marketplace-wide
- Vendor admin fulfillment setting changes
- Backend enforcement rejecting pickup methods

---

## Wizard Structure

| Step | Label | Content |
|------|-------|---------|
| 1 | Dates | Start/end date pickers, check availability |
| 2 | Delivery | Delivery address (saved or new), delivery window, return pickup window, outside-service-area warning |
| 3 | Review | Date summary, delivery summary, rental + fulfillment fees, total |

The **Handoff** step (pickup/delivery method toggles) is removed. Methods are hardcoded on wizard open.

### Step Labels (stepper)

`Dates` → `Delivery` → `Review`

---

## API Mapping (unchanged)

```json
{
  "costumeId": 123,
  "startDate": "2026-07-01",
  "endDate": "2026-07-03",
  "fulfillment": {
    "outbound_method": "DELIVERY",
    "return_method": "DELIVERY",
    "delivery_window_slot": "AFTERNOON",
    "return_window_slot": "AFTERNOON",
    "use_same_location_for_return": true,
    "outbound_location": { "saved_location_id": 1 }
  }
}
```

---

## Product Page

- Remove quick-add logic and pickup-default helper copy.
- Both CTAs open the same wizard with different `intent` (`cart` vs `reserve`).
- Optional one-line note: delivery and return pickup are included.

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Guest clicks CTA | Toast with login link (existing) |
| Vendor config disallows delivery | Submit fails; show API error toast |
| No saved locations | Delivery step shows new-address form |
| Address outside service area | Warning alert (existing); allow proceed |
| User owns the costume | Buttons disabled (existing) |
| Delivery mode not in vendor return config | API error on submit; no new backend guard in phase 1 |

---

## Testing Strategy (Manual)

1. Logged-in renter: Reserve now → complete 3 steps → cart drawer opens.
2. Logged-in renter: Add to cart → same wizard → toast success, no drawer.
3. Guest: both buttons show login toast, no modal.
4. New address flow: complete booking without saved locations.
5. Saved location flow: select default saved address.
6. Review step shows delivery badges and correct fee total.

---

## Decision Log

| # | Decision | Alternatives | Rationale |
|---|----------|--------------|-----------|
| 1 | Defer cart-wide checkout | Ship now | Too large; delivery-first reduces scope |
| 2 | Full delivery service (B) | Outbound delivery only | Renter never visits vendor for handoff |
| 3 | Phase 1 = renter UI only | + API enforcement | Faster iteration |
| 4 | Same wizard for both CTAs | Single button; quick-add | User preference; drawer-only difference |
| 5 | 3-step wizard, remove Handoff | Keep Handoff, hide pickup | Less noise; methods are fixed |
| 6 | Return = DELIVERY + same address | Return = PICKUP | PICKUP return means drop at vendor location |
| 7 | Remove quick-add mode | Keep dates-only add | Conflicts with delivery-only model |

---

## Future Work (Out of Scope)

- Cart-wide checkout: dates per costume, fulfillment per vendor group on one screen
- Backend enforcement of delivery-only reservations
- Marketplace filter: hide costumes without delivery support
- Optional separate return address
