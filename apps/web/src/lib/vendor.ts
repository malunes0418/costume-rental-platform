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

export type VendorCostume = Record<string, unknown>;
export type VendorCostumePayload = Record<string, unknown>;

export type Message = {
  id: number;
  reservation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
};

export type ReservationPayment = {
  id: number;
  reservation_ids: number[];
  user_id: number;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  proof_url?: string | null;
  notes?: string | null;
  created_at?: string;
};

export type ReservationCustomer = {
  id: number;
  name?: string | null;
  email?: string | null;
};

export type ReservationItem = {
  id: number;
  reservation_id: number;
  costume_id: number;
  quantity: number;
  price_per_day: number;
  subtotal: number;
  Costume?: {
    id: number;
    name: string;
  };
};

export type Reservation = {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  total_price: number;
  status: "CART" | "PENDING_PAYMENT" | "PAID" | "CANCELLED";
  vendor_status: "PENDING_VENDOR" | "CONFIRMED" | "REJECTED_BY_VENDOR";
  currency?: string;
  created_at: string;
  User?: ReservationCustomer;
  items?: ReservationItem[];
  payments?: ReservationPayment[];
};

// ─── API calls ───────────────────────────────────────────

export function applyForVendor(payload: VendorApplicationPayload) {
  const bodyPayload = {
    ...payload,
    business_name: payload.store_name,
    bio: payload.store_description,
    id_document_url: payload.id_document_url || "https://example.com/dummy-id.png"
  };
  return apiFetch<{ success: boolean; data: VendorProfile }>("/api/vendors/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyPayload),
  });
}

export function getVendorProfile() {
  return apiFetch<{ success: boolean; data: VendorProfile | null }>("/api/vendors/me", {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
    }
  });
}

export function listVendorCostumes() {
  return apiFetch<{ success: boolean; data: VendorCostume[] }>("/api/vendors/costumes");
}

export function createVendorCostume(payload: VendorCostumePayload) {
  return apiFetch<{ success: boolean; data: VendorCostume }>("/api/vendors/costumes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateVendorCostume(id: number, payload: VendorCostumePayload) {
  return apiFetch<{ success: boolean; data: VendorCostume }>(`/api/vendors/costumes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteVendorCostume(id: number) {
  return apiFetch<{ success: boolean }>(`/api/vendors/costumes/${id}`, {
    method: "DELETE",
  });
}

export function listVendorReservations() {
  return apiFetch<{ success: boolean; data: Reservation[] }>("/api/vendors/reservations");
}

export function approveReservation(id: number) {
  return apiFetch<{ success: boolean; data: Reservation }>(`/api/vendors/reservations/${id}/approve`, {
    method: "POST",
  });
}

export function rejectReservation(id: number) {
  return apiFetch<{ success: boolean; data: Reservation }>(`/api/vendors/reservations/${id}/reject`, {
    method: "POST",
  });
}

export function listReservationMessages(id: number) {
  return apiFetch<{ success: boolean; data: Message[] }>(`/api/vendors/reservations/${id}/messages`);
}

export function createReservationMessage(id: number, content: string) {
  return apiFetch<{ success: boolean; data: Message }>(`/api/vendors/reservations/${id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
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

export function getMySubscription() {
  return apiFetch<Subscription | null>("/api/subscriptions/me");
}

export function subscribeToPlan(planName: string) {
  return apiFetch<Subscription>("/api/subscriptions/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planName }),
  });
}

