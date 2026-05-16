# Global Cart & Unified Checkout Design

## Understanding Summary
- **What is being built:** A Global Cart Drawer (slide-over) and a unified checkout flow for the costume rental platform.
- **Why it exists:** To eliminate the disjointed, multi-step process (Add to Cart -> Navigate to Reservations -> Checkout -> Upload Proof individually) and improve conversion rates by allowing users to manage multiple rentals and upload a single payment proof for the entire order without leaving their current context.
- **Who it is for:** Customers renting costumes on the SnapCos platform.
- **Key constraints:** Must use the existing monochromatic "Exhibition Modern" aesthetic with impeccable front-end craft.
- **Explicit non-goals:** We are not integrating an automated payment gateway (like Stripe) at this time; we are streamlining the manual payment proof system.

## Assumptions (Non-Functional Requirements)
- **Performance:** The slide-over must open instantly. Image uploads for the payment proof should feel fast, with clear loading indicators to prevent double-submissions.
- **Reliability:** If a user successfully checks out but their network drops during the image upload, the system must fail gracefully. Reservations will remain as `PENDING_PAYMENT`, and the user can retry uploading the proof via the Reservations page or by reopening the drawer.
- **Security:** Payment proofs are standard image/PDF files and will continue to use the existing secure upload endpoints.
- **Maintenance:** The slide-over logic will be encapsulated in a global `CartDrawer` component to prevent individual pages from becoming bloated.

## Decision Log
- **Decided:** Use a Global Cart Drawer (`CartDrawer.tsx` via Shadcn `Sheet`) mounted in the `Navbar` for a seamless "multi-item" e-commerce checkout experience.
- **Decided:** Implement a "Unified UX" approach where the user uploads one receipt for the entire cart.
- **Decided:** Modify the backend architecture to support this unified payment natively, rather than hacking the frontend.
- **Decided:** Update the `Payment` database model to store `reservation_ids` (an array/JSON field) instead of a single `reservation_id`.
- **Decided:** Update the `/api/payments/proof` API to accept `reservationIds[]` from the frontend, creating exactly one Payment record tied to multiple reservations.
- **Decided:** Update the Admin approval logic so that approving this single payment automatically marks all linked reservations as `PAID`.
- **Decided:** Frontend will follow impeccable craft standards: monochromatic styling, fluid micro-interactions, perfect alignment, and high-end aesthetic feedback during loading/success states.

## Final Design Flow

### Backend Modifications
1. **Database Schema:** Alter the `payments` table to replace `reservation_id` with `reservation_ids` (JSON array or equivalent).
2. **Payment Service:** Update `PaymentService.uploadProof` to accept `reservationIds`. It will validate that all IDs belong to the user and are `PENDING_PAYMENT`, then create the Payment record with the provided `proof_url` and total `amount`.
3. **Admin Service:** Update `PaymentService.adminReview` to loop over all IDs in `reservation_ids` and update each associated reservation to `PAID`.

### Frontend Implementation
1. **Component Structure:**
   - Create `src/components/CartDrawer.tsx`.
   - Embed it inside `src/components/Navbar.tsx`.
   - Use Zustand or React Context to expose `openCart()` and `refreshCart()`.
2. **Drawer Views:**
   - **Cart View:** Displays `CART` items with images, dates, and prices. Calculates `Grand Total`. Action: "Proceed to Payment".
   - **Upload View:** Displays the `Grand Total` amount, a sleek file picker, and a "Confirm & Pay" button.
   - **Success View:** Beautiful confirmation state with a call to action to "View Curation" (Reservations).
   - **Empty State:** Minimalist text: "Your curation is empty."
3. **Data Flow:**
   - Click "Confirm & Pay" -> Call `/api/reservations/cart/checkout` for all cart items (Promise.all) -> Items move to `PENDING_PAYMENT`.
   - Construct `FormData` with `reservationIds[]` array, `amount` (Grand Total), and `proof` (File).
   - POST to `/api/payments/proof`.
   - Transition to Success View.
