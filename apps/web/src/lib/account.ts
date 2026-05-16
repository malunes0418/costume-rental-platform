import { apiFetch } from "./api";
import type { Costume } from "./costumes";

export type ReservationItem = {
  id: number;
  reservation_id: number;
  costume_id: number;
  quantity: number;
  price_per_day: number;
  subtotal: number;
  Costume?: Costume;
};

export type ReservationWithItems = {
  id: number;
  user_id: number;
  status: string;
  start_date: string;
  end_date: string;
  total_price: number;
  currency: string;
  created_at?: string;
  items?: ReservationItem[];
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
  status: string;
  notes?: string;
  created_at?: string;
};

export function myReservations() {
  return apiFetch<ReservationWithItems[]>("/api/reservations/my");
}

export function checkoutReservation(reservationId: number) {
  return apiFetch<ReservationWithItems>("/api/reservations/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reservationId }),
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


