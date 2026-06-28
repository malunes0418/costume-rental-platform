import { isCartReservationDraft, type ReservationWithItems } from "@/lib/account";

export type CartDraftMissing = "dates" | "delivery";

export function getCartDraftMissing(reservation: ReservationWithItems): CartDraftMissing[] {
  const missing: CartDraftMissing[] = [];
  if (!reservation.start_date || !reservation.end_date) missing.push("dates");
  if (!reservation.fulfillment) missing.push("delivery");
  return missing;
}

export function getCartDraftStatusMeta(reservation: ReservationWithItems) {
  const missing = getCartDraftMissing(reservation);

  if (missing.length === 0) {
    return {
      label: "Ready for checkout",
      className: "border-emerald-400/40 text-emerald-700 dark:text-emerald-400",
      missing
    };
  }

  if (missing.length === 2) {
    return {
      label: "Dates & delivery needed",
      className: "border-amber-400/40 text-amber-700 dark:text-amber-300",
      missing
    };
  }

  if (missing.includes("dates")) {
    return {
      label: "Dates needed",
      className: "border-amber-400/40 text-amber-700 dark:text-amber-300",
      missing
    };
  }

  return {
    label: "Delivery needed",
    className: "border-amber-400/40 text-amber-700 dark:text-amber-300",
    missing
  };
}

export function isCartReservationReadyToPay(reservation: ReservationWithItems) {
  return reservation.status === "CART" && !isCartReservationDraft(reservation);
}

export function isCheckoutSelectable(reservation: ReservationWithItems) {
  if (reservation.status === "PENDING_PAYMENT") return true;
  return isCartReservationReadyToPay(reservation);
}

export function isCartReservationDraftOnly(reservation: ReservationWithItems) {
  return reservation.status === "CART" && isCartReservationDraft(reservation);
}

export function sumReservationTotals(reservations: ReservationWithItems[]) {
  return reservations.reduce((sum, reservation) => sum + Number(reservation.total_price), 0);
}

export function isCartReservationSelectable(reservation: ReservationWithItems) {
  return getCartDraftMissing(reservation).length === 0;
}

export function vendorIdForReservation(reservation: ReservationWithItems) {
  return Number(
    reservation.items?.[0]?.Costume?.owner?.id || reservation.items?.[0]?.Costume?.owner_id || 0
  );
}

export function vendorNameForReservation(reservation: ReservationWithItems) {
  const owner = reservation.items?.[0]?.Costume?.owner;
  const storeName = owner?.VendorProfile?.business_name?.trim();
  if (storeName) return storeName;
  if (owner?.name) return owner.name;
  const vendorId = vendorIdForReservation(reservation);
  return vendorId ? `Vendor ${vendorId}` : "Vendor";
}

export function getCartWorkflowStep(reservations: ReservationWithItems[]) {
  const cartItems = reservations.filter((reservation) => reservation.status === "CART");
  if (cartItems.length === 0) return 1;
  if (cartItems.some((reservation) => !reservation.start_date || !reservation.end_date)) return 1;
  if (cartItems.some((reservation) => !reservation.fulfillment)) return 2;
  return 3;
}

export function groupCartReservationsByVendor(reservations: ReservationWithItems[]) {
  const groups = new Map<number, { vendorName: string; items: ReservationWithItems[] }>();

  for (const reservation of reservations) {
    if (reservation.status !== "CART") continue;
    const vendorId = vendorIdForReservation(reservation);
    if (!vendorId) continue;

    const existing = groups.get(vendorId);
    if (existing) {
      existing.items.push(reservation);
      continue;
    }

    groups.set(vendorId, {
      vendorName: vendorNameForReservation(reservation),
      items: [reservation]
    });
  }

  return groups;
}
