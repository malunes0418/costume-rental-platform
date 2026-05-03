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
  reservation_id: number;
  user_id: number;
  amount: number;
  proof_url: string;
  status: string;
  notes?: string;
  created_at?: string;
};

export function myReservations(token: string) {
  return apiFetch<ReservationWithItems[]>("/api/reservations/my", { token });
}

export function checkoutReservation(token: string, reservationId: number) {
  return apiFetch<ReservationWithItems>("/api/reservations/checkout", {
    method: "POST",
    token,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reservationId }),
  });
}

export function myWishlist(token: string) {
  return apiFetch<WishlistItem[]>("/api/wishlist", { token });
}

export function removeWishlist(token: string, costumeId: number) {
  return apiFetch<{ success: true }>(`/api/wishlist/${costumeId}`, { method: "DELETE", token });
}

export function myNotifications(token: string) {
  return apiFetch<Notification[]>("/api/notifications", { token });
}

export function markNotificationRead(token: string, id: number) {
  return apiFetch<Notification>(`/api/notifications/${id}/read`, { method: "POST", token });
}

export function markAllNotificationsRead(token: string) {
  return apiFetch<{ success: true }>("/api/notifications/read-all", { method: "POST", token });
}

export function myPayments(token: string) {
  return apiFetch<Payment[]>("/api/payments/my", { token });
}

