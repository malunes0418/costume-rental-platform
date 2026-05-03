import { apiFetch } from "./api";

// ─── Types ───────────────────────────────────────────────
export type VendorProfile = {
  id: number;
  user_id: number;
  store_name: string;
  store_description?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
  updated_at: string;
};

export type VendorApplicationPayload = {
  store_name: string;
  store_description?: string;
  id_document_url?: string;
};

export type Message = {
  id: number;
  reservation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
};

export type Reservation = {
  id: number;
  costume_id: number;
  renter_id: number;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  created_at: string;
};

// ─── API calls ───────────────────────────────────────────

export function applyForVendor(payload: VendorApplicationPayload, token: string) {
  const bodyPayload = {
    ...payload,
    id_document_url: payload.id_document_url || "https://example.com/dummy-id.png"
  };
  return apiFetch<{ success: boolean; data: VendorProfile }>("/api/vendors/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyPayload),
    token,
  });
}

export function getVendorProfile(token: string) {
  return apiFetch<{ success: boolean; data: VendorProfile | null }>("/api/vendors/me", {
    token,
  });
}

export function listVendorCostumes(token: string) {
  return apiFetch<{ success: boolean; data: any[] }>("/api/vendors/costumes", {
    token,
  });
}

export function createVendorCostume(payload: any, token: string) {
  return apiFetch<{ success: boolean; data: any }>("/api/vendors/costumes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    token,
  });
}

export function updateVendorCostume(id: number, payload: any, token: string) {
  return apiFetch<{ success: boolean; data: any }>(`/api/vendors/costumes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    token,
  });
}

export function deleteVendorCostume(id: number, token: string) {
  return apiFetch<{ success: boolean }>(`/api/vendors/costumes/${id}`, {
    method: "DELETE",
    token,
  });
}

export function listVendorReservations(token: string) {
  return apiFetch<{ success: boolean; data: Reservation[] }>("/api/vendors/reservations", {
    token,
  });
}

export function approveReservation(id: number, token: string) {
  return apiFetch<{ success: boolean; data: Reservation }>(`/api/vendors/reservations/${id}/approve`, {
    method: "POST",
    token,
  });
}

export function rejectReservation(id: number, token: string) {
  return apiFetch<{ success: boolean; data: Reservation }>(`/api/vendors/reservations/${id}/reject`, {
    method: "POST",
    token,
  });
}

export function listReservationMessages(id: number, token: string) {
  return apiFetch<{ success: boolean; data: Message[] }>(`/api/vendors/reservations/${id}/messages`, {
    token,
  });
}

export function createReservationMessage(id: number, content: string, token: string) {
  return apiFetch<{ success: boolean; data: Message }>(`/api/vendors/reservations/${id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
    token,
  });
}

// ─── Subscription API calls ──────────────────────────────

export type Subscription = {
  id: number;
  user_id: number;
  plan_name: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
};

export function getMySubscription(token: string) {
  // Backend returns the Subscription directly, or null if empty.
  return apiFetch<Subscription | null>("/api/subscriptions/me", { token });
}

export function subscribeToPlan(planName: string, token: string) {
  return apiFetch<Subscription>("/api/subscriptions/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planName }),
    token,
  });
}
