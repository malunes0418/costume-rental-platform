import { apiFetch } from "./api";
import type {
  ReservationAdjustment,
  ReservationFulfillment,
  ReservationFulfillmentSelectionInput,
  SavedLocation,
  SavedLocationInput
} from "./fulfillment";
import type { Costume } from "./costumes";
import type { PricingMode } from "./pricing";
import type {
  PaymentStatus,
  ReservationStatus,
  VendorReservationStatus
} from "./reservationStatus";

export type ReservationItem = {
  id: number;
  reservation_id: number;
  costume_id: number;
  quantity: number;
  price_per_day: number;
  pricing_mode: PricingMode;
  package_base_price?: number | null;
  package_included_days?: number | null;
  package_unused_day_discount?: number | null;
  package_extra_day_charge?: number | null;
  subtotal: number;
  Costume?: Costume;
};

export type ReservationWithItems = {
  id: number;
  user_id: number;
  status: ReservationStatus;
  vendor_status?: VendorReservationStatus;
  start_date: string;
  end_date: string;
  total_price: number;
  currency: string;
  created_at?: string;
  items?: ReservationItem[];
  fulfillment?: ReservationFulfillment | null;
  adjustments?: ReservationAdjustment[];
};

export type WishlistItem = {
  id: number;
  user_id: number;
  costume_id: number;
  created_at?: string;
  Costume?: Costume;
};

export type Notification = {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at?: string;
};

export type Payment = {
  id: number;
  reservation_ids: number[];
  user_id: number;
  amount: number;
  proof_url: string;
  status: PaymentStatus;
  payment_purpose: "INITIAL_RESERVATION" | "RESERVATION_ADJUSTMENT";
  reservation_adjustment_id?: number | null;
  reservationAdjustment?: ReservationAdjustment | null;
  notes?: string;
  created_at?: string;
};

export type AddToCartPayload = {
  costumeId: number;
  quantity?: number;
  startDate: string;
  endDate: string;
  fulfillment: ReservationFulfillmentSelectionInput;
};

export function myReservations() {
  return apiFetch<ReservationWithItems[]>("/api/reservations/my");
}

export function addReservationToCart(payload: AddToCartPayload) {
  return apiFetch<{ reservation: ReservationWithItems }>("/api/reservations/cart", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function checkoutReservation(reservationId: number) {
  return apiFetch<ReservationWithItems>("/api/reservations/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reservationId }),
  });
}

export function removeReservation(reservationId: number) {
  return apiFetch<{ success: true }>(`/api/reservations/${reservationId}`, {
    method: "DELETE",
  });
}

export function confirmReservationReceived(reservationId: number, proof: File) {
  const form = new FormData();
  form.set("proof", proof);
  return apiFetch<ReservationWithItems>(`/api/reservations/${reservationId}/confirm-received`, {
    method: "POST",
    body: form
  });
}

export function initiateReservationReturn(reservationId: number, proof: File) {
  const form = new FormData();
  form.set("proof", proof);
  return apiFetch<ReservationWithItems>(`/api/reservations/${reservationId}/initiate-return`, {
    method: "POST",
    body: form
  });
}

export function cancelReservation(reservationId: number) {
  return apiFetch<ReservationWithItems>(`/api/reservations/${reservationId}/cancel`, {
    method: "POST"
  });
}

export function myWishlist() {
  return apiFetch<WishlistItem[]>("/api/wishlist");
}

export function addWishlist(costumeId: number) {
  return apiFetch<WishlistItem>("/api/wishlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ costumeId }),
  });
}

export function removeWishlist(costumeId: number) {
  return apiFetch<{ success: true }>(`/api/wishlist/${costumeId}`, { method: "DELETE" });
}

export function myNotifications() {
  return apiFetch<Notification[]>("/api/notifications");
}

export function markNotificationRead(id: number) {
  return apiFetch<Notification>(`/api/notifications/${id}/read`, { method: "POST" });
}

export function markAllNotificationsRead() {
  return apiFetch<{ success: true }>("/api/notifications/read-all", { method: "POST" });
}

export function myPayments() {
  return apiFetch<Payment[]>("/api/payments/my");
}

export function uploadReservationAdjustmentPayment(adjustmentId: number, file: File) {
  const form = new FormData();
  form.set("reservationAdjustmentId", String(adjustmentId));
  form.set("proof", file);

  return apiFetch<Payment>("/api/payments/proof", {
    method: "POST",
    body: form
  });
}

export function listSavedLocations() {
  return apiFetch<SavedLocation[]>("/api/account/locations");
}

export function createSavedLocation(payload: SavedLocationInput) {
  return apiFetch<SavedLocation>("/api/account/locations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function updateSavedLocation(locationId: number, payload: SavedLocationInput) {
  return apiFetch<SavedLocation>(`/api/account/locations/${locationId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function deleteSavedLocation(locationId: number) {
  return apiFetch<{ success: true }>(`/api/account/locations/${locationId}`, {
    method: "DELETE"
  });
}


