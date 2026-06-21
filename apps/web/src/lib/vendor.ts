import { apiFetch } from "./api";
import type {
  CostumeFulfillmentOverride,
  CostumeFulfillmentOverrideInput,
  ReservationAdjustment,
  ReservationFulfillment,
  VendorFulfillmentSettings,
  VendorFulfillmentSettingsInput
} from "./fulfillment";
import type { PricingMode } from "./pricing";
import type {
  PaymentStatus,
  ReservationStatus,
  VendorReservationStatus
} from "./reservationStatus";

export type VendorStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";
export type VendorBlockingReason =
  | "APPLICATION_REQUIRED"
  | "APPLICATION_UNDER_REVIEW"
  | "APPLICATION_REJECTED";

export type VendorProfileData = {
  id: number;
  user_id: number;
  business_name?: string | null;
  bio?: string | null;
  id_document_url?: string | null;
  review_note?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type VendorProfile = {
  profile: VendorProfileData | null;
  status: VendorStatus;
  vendorStatus: VendorStatus;
  canManageDrafts: boolean;
  canPublish: boolean;
  canAcceptReservations: boolean;
  blockingReasons: VendorBlockingReason[];
};

export type VendorApplicationPayload = {
  business_name: string;
  bio?: string;
  id_document: File;
};

export type VendorCostume = {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  size?: string | null;
  gender?: string | null;
  theme?: string | null;
  pricing_mode: PricingMode;
  base_price_per_day?: number | null;
  package_price?: number | null;
  package_included_days?: number | null;
  package_unused_day_discount?: number | null;
  package_extra_day_charge?: number | null;
  deposit_amount: number;
  stock: number;
  is_active: boolean;
  owner_id?: number | null;
  status: "DRAFT" | "ACTIVE" | "HIDDEN" | "FLAGGED";
  created_at?: string;
  updated_at?: string;
  CostumeImages?: Array<{
    id: number;
    costume_id: number;
    image_url: string;
    is_primary: boolean;
  }>;
  fulfillmentOverride?: CostumeFulfillmentOverride | null;
};

export type VendorCostumePayload = {
  name: string;
  description?: string;
  category?: string;
  size?: string;
  gender?: string;
  theme?: string;
  pricing_mode: PricingMode;
  base_price_per_day?: number | null;
  package_price?: number | null;
  package_included_days?: number | null;
  package_unused_day_discount?: number | null;
  package_extra_day_charge?: number | null;
  deposit_amount?: number;
  stock?: number;
  images: string[];
  fulfillment_override?: CostumeFulfillmentOverrideInput | null;
};

export type DeleteVendorCostumeResult = {
  message: string;
  deleted: boolean;
  archived: boolean;
};

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
  status: PaymentStatus;
  payment_purpose: "INITIAL_RESERVATION" | "RESERVATION_ADJUSTMENT";
  reservation_adjustment_id?: number | null;
  reservationAdjustment?: ReservationAdjustment | null;
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
  pricing_mode: PricingMode;
  package_base_price?: number | null;
  package_included_days?: number | null;
  package_unused_day_discount?: number | null;
  package_extra_day_charge?: number | null;
  subtotal: number;
  Costume?: {
    id: number;
    name: string;
    owner_id?: number | null;
  };
};

export type Reservation = {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  total_price: number;
  status: ReservationStatus;
  vendor_status: VendorReservationStatus;
  currency?: string;
  created_at: string;
  User?: ReservationCustomer;
  items?: ReservationItem[];
  payments?: ReservationPayment[];
  fulfillment?: ReservationFulfillment | null;
  adjustments?: ReservationAdjustment[];
};

export type VendorReservationSurchargePayload = {
  amount: number | string;
  note: string;
};

export function applyForVendor(payload: VendorApplicationPayload) {
  const formData = new FormData();
  formData.append("business_name", payload.business_name);
  if (payload.bio) {
    formData.append("bio", payload.bio);
  }
  formData.append("id_document", payload.id_document);

  return apiFetch<VendorProfile>("/api/vendors/apply", {
    method: "POST",
    body: formData
  });
}

export function getVendorProfile() {
  return apiFetch<VendorProfile>("/api/vendors/me", {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache"
    }
  });
}

export function listVendorCostumes() {
  return apiFetch<VendorCostume[]>("/api/vendors/costumes");
}

export function createVendorCostume(payload: VendorCostumePayload) {
  return apiFetch<VendorCostume>("/api/vendors/costumes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function updateVendorCostume(id: number, payload: Partial<VendorCostumePayload>) {
  return apiFetch<VendorCostume>(`/api/vendors/costumes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function publishVendorCostume(id: number) {
  return apiFetch<VendorCostume>(`/api/vendors/costumes/${id}/publish`, {
    method: "POST"
  });
}

export function unpublishVendorCostume(id: number) {
  return apiFetch<VendorCostume>(`/api/vendors/costumes/${id}/unpublish`, {
    method: "POST"
  });
}

export function deleteVendorCostume(id: number) {
  return apiFetch<DeleteVendorCostumeResult>(`/api/vendors/costumes/${id}`, {
    method: "DELETE"
  });
}

export function listVendorReservations() {
  return apiFetch<Reservation[]>("/api/vendors/reservations");
}

export function reviewVendorPayment(paymentId: number, status: "APPROVED" | "REJECTED", notes = "") {
  return apiFetch<{ payment: ReservationPayment; reservations: Reservation[] }>("/api/vendors/payments/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId, status, notes })
  });
}

export function getVendorFulfillmentSettings() {
  return apiFetch<VendorFulfillmentSettings | null>("/api/vendors/fulfillment-settings");
}

export function updateVendorFulfillmentSettings(payload: VendorFulfillmentSettingsInput) {
  return apiFetch<VendorFulfillmentSettings>("/api/vendors/fulfillment-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function approveReservation(id: number) {
  return apiFetch<Reservation>(`/api/vendors/reservations/${id}/approve`, {
    method: "POST"
  });
}

export function rejectReservation(id: number) {
  return apiFetch<Reservation>(`/api/vendors/reservations/${id}/reject`, {
    method: "POST"
  });
}

export function requestReservationSurcharge(id: number, payload: VendorReservationSurchargePayload) {
  return apiFetch<Reservation>(`/api/vendors/reservations/${id}/surcharge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function dispatchReservation(id: number, proof?: File) {
  const form = new FormData();
  if (proof) {
    form.set("proof", proof);
  }
  return apiFetch<Reservation>(`/api/vendors/reservations/${id}/dispatch`, {
    method: "POST",
    body: proof ? form : undefined
  });
}

export function confirmVendorReturn(id: number, proof?: File) {
  const form = new FormData();
  if (proof) {
    form.set("proof", proof);
  }
  return apiFetch<Reservation>(`/api/vendors/reservations/${id}/confirm-return`, {
    method: "POST",
    body: proof ? form : undefined
  });
}

export function completeReservation(id: number) {
  return apiFetch<Reservation>(`/api/vendors/reservations/${id}/complete`, {
    method: "POST"
  });
}

export function waiveReservationAdjustment(reservationId: number, adjustmentId: number) {
  return apiFetch<Reservation>(`/api/vendors/reservations/${reservationId}/adjustments/${adjustmentId}/waive`, {
    method: "POST"
  });
}

export function listReservationMessages(id: number) {
  return apiFetch<Message[]>(`/api/reservations/${id}/messages`);
}

export function createReservationMessage(id: number, content: string) {
  return apiFetch<Message>(`/api/reservations/${id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });
}

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
    body: JSON.stringify({ planName })
  });
}
