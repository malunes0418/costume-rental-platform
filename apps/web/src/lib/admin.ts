import { apiFetch } from "./api";

// ── Types ──────────────────────────────────────────────────────────────────────

export type AdminUser = {
  id: number;
  name?: string;
  email?: string;
  role: string;
  created_at?: string;
};

export type AdminReservation = {
  id: number;
  user_id: number;
  status: string;
  start_date: string;
  end_date: string;
  total_price: number;
  currency?: string;
  created_at?: string;
  items?: any[];
  User?: { name?: string; email?: string };
};

export type AdminPayment = {
  id: number;
  reservation_ids: number[];
  user_id: number;
  amount: number;
  proof_url?: string;
  status: string;
  notes?: string;
  created_at?: string;
};

export type AdminInventoryItem = {
  id: number;
  name: string;
  category?: string;
  stock: number;
  base_price_per_day: number;
  status?: string;
};

export type PendingVendor = {
  id: number;
  user_id: number;
  store_name?: string;
  business_name?: string;
  bio?: string;
  id_document_url?: string;
  review_note?: string | null;
  reviewed_at?: string | null;
  status: string;
  created_at?: string;
  User?: { name?: string; email?: string };
};

// ── API functions ──────────────────────────────────────────────────────────────

export function adminListUsers() {
  return apiFetch<AdminUser[]>("/api/admin/users");
}

export function adminListReservations() {
  return apiFetch<AdminReservation[]>("/api/admin/reservations");
}

export function adminListPayments() {
  return apiFetch<AdminPayment[]>("/api/admin/payments");
}

export function adminListInventory() {
  return apiFetch<AdminInventoryItem[]>("/api/admin/inventory");
}

export function adminListPendingVendors() {
  return apiFetch<PendingVendor[]>("/api/admin/vendors/pending");
}

export function adminListAllVendors() {
  return apiFetch<PendingVendor[]>("/api/admin/vendors");
}

export function adminApproveVendor(userId: number, review_note?: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/vendors/${userId}/approve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ review_note }),
  });
}

export function adminRejectVendor(userId: number, review_note?: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/vendors/${userId}/reject`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ review_note }),
  });
}

export function adminReviewPayment(
  paymentId: number,
  status: "APPROVED" | "REJECTED",
  notes: string,
) {
  return apiFetch<{ success: boolean }>("/api/admin/payments/review", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ paymentId, status, notes }),
  });
}

export function adminUpdateCostumeStatus(costumeId: number, status: "ACTIVE" | "HIDDEN" | "FLAGGED") {
  return apiFetch<{ success: boolean }>(`/api/admin/costumes/${costumeId}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function adminUpdateReservationStatus(reservationId: number, status: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/reservations/${reservationId}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function adminUpdateUserRole(userId: number, role: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role }),
  });
}

