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
  reservation_id: number;
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
  status: string;
  created_at?: string;
  User?: { name?: string; email?: string };
};

// ── API functions ──────────────────────────────────────────────────────────────

export function adminListUsers(token: string) {
  return apiFetch<AdminUser[]>("/api/admin/users", { token });
}

export function adminListReservations(token: string) {
  return apiFetch<AdminReservation[]>("/api/admin/reservations", { token });
}

export function adminListPayments(token: string) {
  return apiFetch<AdminPayment[]>("/api/admin/payments", { token });
}

export function adminListInventory(token: string) {
  return apiFetch<AdminInventoryItem[]>("/api/admin/inventory", { token });
}

export function adminListPendingVendors(token: string) {
  return apiFetch<PendingVendor[]>("/api/admin/vendors/pending", { token });
}

export function adminListAllVendors(token: string) {
  return apiFetch<PendingVendor[]>("/api/admin/vendors", { token });
}

export function adminApproveVendor(userId: number, token: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/vendors/${userId}/approve`, {
    method: "POST",
    token,
  });
}

export function adminRejectVendor(userId: number, token: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/vendors/${userId}/reject`, {
    method: "POST",
    token,
  });
}

export function adminReviewPayment(
  paymentId: number,
  status: "APPROVED" | "REJECTED",
  notes: string,
  token: string
) {
  return apiFetch<{ success: boolean }>("/api/admin/payments/review", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ paymentId, status, notes }),
    token,
  });
}

export function adminUpdateCostumeStatus(costumeId: number, status: "ACTIVE" | "HIDDEN" | "FLAGGED", token: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/costumes/${costumeId}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
    token,
  });
}

export function adminUpdateReservationStatus(reservationId: number, status: string, token: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/reservations/${reservationId}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
    token,
  });
}

export function adminUpdateUserRole(userId: number, role: string, token: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role }),
    token,
  });
}
