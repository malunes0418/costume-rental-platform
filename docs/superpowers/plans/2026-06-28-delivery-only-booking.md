# Delivery-Only Renter Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the costume booking wizard to a 3-step delivery-only flow and remove the quick-add cart path, while keeping both product-page CTAs on the same wizard.

**Architecture:** All changes are in `apps/web`. `ReservationWizard` drops the Handoff step, hardcodes `DELIVERY`/`DELIVERY` with `use_same_location_for_return: true`, and merges address + time windows into a single Delivery step. `costumes/[id]/page.tsx` removes quick-add helper copy. No backend changes.

**Tech Stack:** Next.js App Router, React, TypeScript, existing shadcn Dialog/Select components, existing `addReservationToCart` API.

## Global Constraints

- Phase 1 is renter UI only — do not change backend validation.
- Logged-in users only for the wizard (`open && !!user`).
- `intent: "reserve"` opens cart drawer on success; `intent: "cart"` does not.
- Fulfillment payload must use `outbound_method: "DELIVERY"`, `return_method: "DELIVERY"`, `use_same_location_for_return: true`.
- Remove all quick-add code (`isQuickAddMode`, `preferPickupMethod`, `cartQuickAddNeedsSavedLocation`).
- Match existing code style; no unrelated refactors.

**Spec:** `docs/superpowers/specs/2026-06-28-delivery-only-booking-design.md`

---

## File Map

| File | Responsibility |
|------|----------------|
| `apps/web/src/components/ReservationWizard.tsx` | 3-step wizard, delivery-only logic, remove quick-add |
| `apps/web/src/app/costumes/[id]/page.tsx` | Remove pickup/quick-add helper text under CTAs |

---

### Task 1: Remove quick-add mode and reset wizard step model

**Files:**
- Modify: `apps/web/src/components/ReservationWizard.tsx`

**Interfaces:**
- Produces: `WizardStep = "dates" | "delivery" | "review"`
- Produces: `STEP_LABELS` with keys `dates`, `delivery`, `review`

- [ ] **Step 1: Delete quick-add helpers and state**

Remove functions `preferPickupMethod`, `cartQuickAddNeedsSavedLocation`, and the `isQuickAddMode` useMemo.

- [ ] **Step 2: Update step types and labels**

```typescript
type WizardStep = "dates" | "delivery" | "review";

const STEP_LABELS: Record<WizardStep, string> = {
  dates: "Dates",
  delivery: "Delivery",
  review: "Review"
};
```

- [ ] **Step 3: Hardcode delivery methods on open**

Replace the open `useEffect` method initialization with:

```typescript
useEffect(() => {
  if (!open) return;
  setStep("dates");
  setStartDate(initialStartDate);
  setEndDate(initialEndDate);
  setOutboundMethod("DELIVERY");
  setReturnMethod("DELIVERY");
  setUseSameLocationForReturn(true);
}, [open, initialStartDate, initialEndDate]);
```

- [ ] **Step 4: Simplify active steps**

Replace `needsLocationStep` / `activeSteps` logic with a fixed array:

```typescript
const activeSteps = useMemo<WizardStep[]>(() => ["dates", "delivery", "review"], []);
```

Remove `outboundNeedsLocation`, `canReuseReturnLocation`, `returnNeedsSeparateLocation`, and `needsLocationStep` variables if no longer referenced (Task 2 will use delivery-specific names).

- [ ] **Step 5: Verify build**

Run: `cd apps/web && npx tsc --noEmit`  
Expected: May fail until Task 2 updates step references — proceed to Task 2.

---

### Task 2: Replace Handoff + Location with single Delivery step

**Files:**
- Modify: `apps/web/src/components/ReservationWizard.tsx`

**Interfaces:**
- Consumes: `WizardStep` includes `"delivery"`
- Produces: `goNext` / `goBack` navigation for 3 steps
- Produces: `validateDeliveryStep()` replacing location validation for delivery-only

- [ ] **Step 1: Update navigation**

```typescript
function goNext() {
  if (step === "dates") {
    if (!startDate || !endDate) {
      toast.error("Please choose start and end dates.");
      return;
    }
    setStep("delivery");
    return;
  }
  if (step === "delivery") {
    if (!validateDeliveryStep()) return;
    setStep("review");
  }
}

function goBack() {
  if (step === "review") {
    setStep("delivery");
    return;
  }
  if (step === "delivery") {
    setStep("dates");
  }
}
```

- [ ] **Step 2: Add validateDeliveryStep**

```typescript
function validateDeliveryStep(): boolean {
  if (outboundLocationMode === "saved" && !selectedOutboundLocationId) {
    toast.error("Choose a delivery address.");
    return false;
  }
  if (outboundLocationMode === "new" && !locationComplete(newOutboundLocation)) {
    toast.error("Complete the delivery address.");
    return false;
  }
  return true;
}
```

Update `handleConfirm` to call `validateDeliveryStep()` instead of `validateLocationStep()` / `needsLocationStep` checks.

- [ ] **Step 3: Remove Handoff step JSX**

Delete the entire `{step === "handoff" ? (...)` block (outbound/return method selects, pickup window, vendor handoff line tied to pickup).

- [ ] **Step 4: Replace Location step with Delivery step**

Rename condition from `step === "location"` to `step === "delivery"`. Content:

- Heading: "Where should we deliver this costume?"
- Saved/new address toggle (always shown — delivery always needs address)
- Remove "Use same location for return pickup" checkbox (always true; hidden)
- Remove separate return pickup location section
- Add delivery window select (`deliveryWindowSlot`)
- Add return pickup window select (`returnWindowSlot`) with label "Return pickup window"
- Keep outside-service-area alert using existing `outboundLocationOutsideServiceArea`

- [ ] **Step 5: Update review step badges**

Replace generic method badges with renter-friendly copy:

```tsx
<Badge variant="outline">Delivery to you</Badge>
<Badge variant="outline">Return pickup at same address</Badge>
```

- [ ] **Step 6: Remove quick-add conditional rendering**

Delete all `isQuickAddMode` branches in JSX (stepper visibility, dates copy, footer). Footer always uses the standard Back/Next/Confirm pattern.

- [ ] **Step 7: Verify build**

Run: `cd apps/web && npx tsc --noEmit`  
Expected: PASS (or only unrelated errors)

---

### Task 3: Ensure fulfillment payload is delivery-only

**Files:**
- Modify: `apps/web/src/components/ReservationWizard.tsx`

- [ ] **Step 1: Simplify buildFulfillmentPayload**

```typescript
function buildFulfillmentPayload(): ReservationFulfillmentSelectionInput {
  return {
    outbound_method: "DELIVERY",
    return_method: "DELIVERY",
    delivery_window_slot: deliveryWindowSlot,
    return_window_slot: returnWindowSlot,
    outbound_location: buildLocationSelection(
      outboundLocationMode,
      selectedOutboundLocationId,
      newOutboundLocation
    ),
    return_location: null,
    use_same_location_for_return: true
  };
}
```

- [ ] **Step 2: Update fulfillment fee preview**

`fulfillmentFees` useMemo should always use delivery fees:

```typescript
const fulfillmentFees = useMemo(() => {
  return (
    Number(data.effective_fulfillment.outbound_delivery_fee) +
    Number(data.effective_fulfillment.return_delivery_fee)
  );
}, [data]);
```

- [ ] **Step 3: Remove dead imports and state**

Remove unused `pickupWindowSlot` state and setter if no longer referenced. Remove `FULFILLMENT_METHOD_LABELS` from review if replaced; keep if used elsewhere in file.

- [ ] **Step 4: Verify build**

Run: `cd apps/web && npx tsc --noEmit`  
Expected: PASS

---

### Task 4: Clean up product page CTA copy

**Files:**
- Modify: `apps/web/src/app/costumes/[id]/page.tsx`

- [ ] **Step 1: Remove quick-add helper paragraphs**

Remove the two `<p className="text-center text-xs ...">` blocks under Reserve now / Add to cart.

- [ ] **Step 2: Update pricing blurb (optional, one line)**

Change the muted helper under pricing from "Reserve to choose dates, fulfillment, and see your full quote." to:

```tsx
"Delivery and return pickup included. Choose dates and your address to see your full quote."
```

Only for non-PACKAGE pricing mode branch.

- [ ] **Step 3: Verify build**

Run: `cd apps/web && npx tsc --noEmit`  
Expected: PASS

---

### Task 5: Manual verification

**Files:** None (manual QA)

- [ ] **Step 1: Start dev server**

Run: `npm run dev` from repo root

- [ ] **Step 2: Guest flow**

Open a costume detail page logged out. Click Reserve now and Add to cart.  
Expected: Login toast, no modal.

- [ ] **Step 3: Reserve now flow**

Log in, open costume, click Reserve now. Complete Dates → Delivery → Review.  
Expected: 3-step stepper, no pickup options, cart drawer opens, toast success.

- [ ] **Step 4: Add to cart flow**

Repeat with Add to cart.  
Expected: Same wizard, no drawer, toast success, cart count updates.

- [ ] **Step 5: New address path**

Log in with no saved locations. Enter new address on Delivery step.  
Expected: Booking succeeds.

- [ ] **Step 6: Lint check**

Run: `cd apps/web && npx tsc --noEmit`  
Expected: PASS

---

## Self-Review (Spec Coverage)

| Spec requirement | Task |
|------------------|------|
| 3-step wizard | Task 1, 2 |
| Remove Handoff | Task 2 |
| Delivery address + windows | Task 2 |
| Same address for return | Task 3 |
| Same wizard both CTAs | Already in place; Task 4 copy |
| Remove quick-add | Task 1, 2 |
| Auth gate | No change needed |
| No backend changes | No backend tasks |
| Review step summary | Task 2 |
