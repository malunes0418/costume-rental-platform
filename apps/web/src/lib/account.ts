import { apiFetch } from "./api";
import type {
  ReservationAdjustment,
  ReservationFulfillment,
  ReservationFulfillmentSelectionInput,
  SavedLocation,
  SavedLocationInput,
  FulfillmentPreferences,
  FulfillmentPreferencesInput
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
  start_date: string | null;
  end_date: string | null;
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

export function addCostumeToCart(costumeId: number, quantity?: number) {
  return apiFetch<{
    reservation: ReservationWithItems;
    item: ReservationItem;
    alreadyInCart: boolean;
  }>("/api/reservations/cart/items", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ costumeId, quantity })
  });
}

export function configureCartReservation(
  reservationId: number,
  payload: Omit<AddToCartPayload, "costumeId" | "quantity">
) {
  return apiFetch<{ reservation: ReservationWithItems }>(`/api/reservations/cart/${reservationId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function isCartReservationDraft(reservation: ReservationWithItems) {
  return !reservation.start_date || !reservation.end_date || !reservation.fulfillment;
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

export function getFulfillmentPreferences() {
  return apiFetch<FulfillmentPreferences>("/api/account/fulfillment-preferences");
}

export function updateFulfillmentPreferences(payload: FulfillmentPreferencesInput) {
  return apiFetch<FulfillmentPreferences>("/api/account/fulfillment-preferences", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export type UpdateProfilePayload = {
  name?: string;
  email?: string;
  current_password?: string;
};

export type UpdateProfileResponse = {
  id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
};

export type NotificationPreferences = {
  user_id: number;
  reservations_email: boolean;
  reservations_push: boolean;
  payments_email: boolean;
  payments_push: boolean;
  messages_email: boolean;
  messages_push: boolean;
  marketing_email: boolean;
  marketing_push: boolean;
};

export type NotificationPreferencesInput = Partial<
  Omit<NotificationPreferences, "user_id">
>;

export function updateProfile(payload: UpdateProfilePayload) {
  return apiFetch<UpdateProfileResponse>("/api/account/profile", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function uploadAvatar(file: File) {
  const form = new FormData();
  form.set("avatar", file);
  return apiFetch<{ avatar_url: string }>("/api/account/avatar", {
    method: "POST",
    body: form
  });
}

export function changePassword(payload: { current_password?: string; new_password: string }) {
  return apiFetch<{ success: true }>("/api/account/password", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function getNotificationPreferences() {
  return apiFetch<NotificationPreferences>("/api/account/notification-preferences");
}

export function updateNotificationPreferences(payload: NotificationPreferencesInput) {
  return apiFetch<NotificationPreferences>("/api/account/notification-preferences", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}


