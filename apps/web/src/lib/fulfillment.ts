export type FulfillmentMode = "PICKUP" | "DELIVERY" | "BOTH";
export type FulfillmentMethod = "PICKUP" | "DELIVERY";
export type FulfillmentWindowSlot = "MORNING" | "AFTERNOON" | "EVENING";
export type PaymentPurpose = "INITIAL_RESERVATION" | "RESERVATION_ADJUSTMENT";
export type ReservationAdjustmentStatus = "PENDING" | "PAID" | "WAIVED" | "REJECTED";
export type ReservationFulfillmentApprovalStatus = "PENDING_VENDOR_REVIEW" | "APPROVED" | "REJECTED";

export const FULFILLMENT_MODE_LABELS: Record<FulfillmentMode, string> = {
  PICKUP: "Pickup only",
  DELIVERY: "Delivery only",
  BOTH: "Pickup or delivery"
};

export const FULFILLMENT_METHOD_LABELS: Record<FulfillmentMethod, string> = {
  PICKUP: "Pickup",
  DELIVERY: "Delivery"
};

export const FULFILLMENT_WINDOW_LABELS: Record<FulfillmentWindowSlot, string> = {
  MORNING: "Morning window",
  AFTERNOON: "Afternoon window",
  EVENING: "Evening window"
};

export type ServiceAreaDefinition = {
  label?: string | null;
  city?: string | null;
  province?: string | null;
  area?: string | null;
  notes?: string | null;
};

export type LocationSnapshot = {
  label?: string | null;
  contact_name?: string | null;
  phone_number?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  barangay?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  area?: string | null;
  notes?: string | null;
};

export type SavedLocation = {
  id: number;
  user_id: number;
  label: string;
  contact_name: string;
  phone_number: string;
  address_line_1: string;
  address_line_2?: string | null;
  barangay?: string | null;
  city: string;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  area?: string | null;
  notes?: string | null;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SavedLocationInput = Omit<SavedLocation, "id" | "user_id" | "created_at" | "updated_at">;

export type VendorFulfillmentSettings = {
  id: number;
  vendor_id: number;
  primary_location: LocationSnapshot | null;
  outbound_mode: FulfillmentMode;
  return_mode: FulfillmentMode;
  outbound_pickup_fee: number;
  outbound_delivery_fee: number;
  return_pickup_fee: number;
  return_delivery_fee: number;
  service_areas: ServiceAreaDefinition[] | null;
  created_at?: string;
  updated_at?: string;
};

export type VendorFulfillmentSettingsInput = {
  primary_location?: LocationSnapshot | null;
  outbound_mode: FulfillmentMode;
  return_mode: FulfillmentMode;
  outbound_pickup_fee?: number | string;
  outbound_delivery_fee?: number | string;
  return_pickup_fee?: number | string;
  return_delivery_fee?: number | string;
  service_areas?: ServiceAreaDefinition[] | null;
};

export type CostumeFulfillmentOverride = {
  id: number;
  costume_id: number;
  outbound_mode: FulfillmentMode;
  return_mode: FulfillmentMode;
  created_at?: string;
  updated_at?: string;
};

export type CostumeFulfillmentOverrideInput = {
  outbound_mode: FulfillmentMode;
  return_mode: FulfillmentMode;
};

export type EffectiveCostumeFulfillment = {
  vendor_settings_configured: boolean;
  primary_location: LocationSnapshot | null;
  service_areas: ServiceAreaDefinition[] | null;
  outbound_mode: FulfillmentMode;
  return_mode: FulfillmentMode;
  outbound_pickup_fee: number;
  outbound_delivery_fee: number;
  return_pickup_fee: number;
  return_delivery_fee: number;
  costume_override: CostumeFulfillmentOverride | null;
};

export type ReservationFulfillmentLocationSelectionInput = {
  saved_location_id?: number | null;
  new_location?: SavedLocationInput | null;
  save_as_default?: boolean;
};

export type ReservationFulfillmentSelectionInput = {
  outbound_method: FulfillmentMethod;
  return_method: FulfillmentMethod;
  pickup_window_slot?: FulfillmentWindowSlot | null;
  delivery_window_slot?: FulfillmentWindowSlot | null;
  return_window_slot: FulfillmentWindowSlot;
  outbound_location?: ReservationFulfillmentLocationSelectionInput | null;
  return_location?: ReservationFulfillmentLocationSelectionInput | null;
  use_same_location_for_return?: boolean;
};

export type ReservationFulfillment = {
  id: number;
  reservation_id: number;
  outbound_method: FulfillmentMethod;
  return_method: FulfillmentMethod;
  outbound_location_id?: number | null;
  outbound_location_snapshot: LocationSnapshot | null;
  return_location_id?: number | null;
  return_location_snapshot: LocationSnapshot | null;
  pickup_window_start?: string | null;
  pickup_window_end?: string | null;
  delivery_window_start?: string | null;
  delivery_window_end?: string | null;
  return_window_start?: string | null;
  return_window_end?: string | null;
  outbound_fee: number;
  return_fee: number;
  outside_service_area: boolean;
  vendor_approval_status: ReservationFulfillmentApprovalStatus;
  vendor_approval_note?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ReservationAdjustment = {
  id: number;
  reservation_id: number;
  type: "OUTSIDE_AREA_SURCHARGE";
  amount: number;
  status: ReservationAdjustmentStatus;
  note?: string | null;
  created_by_user_id?: number | null;
  created_at?: string;
  updated_at?: string;
};

export function modeAllowsMethod(mode: FulfillmentMode, method: FulfillmentMethod) {
  return mode === "BOTH" || mode === method;
}

export function narrowingOptionsForMode(mode: FulfillmentMode) {
  if (mode === "PICKUP") {
    return ["PICKUP"] as FulfillmentMode[];
  }
  if (mode === "DELIVERY") {
    return ["DELIVERY"] as FulfillmentMode[];
  }

  return ["BOTH", "PICKUP", "DELIVERY"] as FulfillmentMode[];
}

export function inferFulfillmentWindowSlot(
  start?: string | null,
  end?: string | null
): FulfillmentWindowSlot | null {
  if (!start || !end) return null;

  const startDate = new Date(start);
  const endDate = new Date(end);
  const startHour = startDate.getHours();
  const endHour = endDate.getHours();

  if (startHour === 9 && endHour === 12) return "MORNING";
  if (startHour === 13 && endHour === 16) return "AFTERNOON";
  if (startHour === 17 && endHour === 20) return "EVENING";

  return null;
}

export function formatLocationSummary(location: LocationSnapshot | null | undefined) {
  if (!location) return "Location pending";

  const headline = location.label || location.area || location.city || "Saved location";
  const line = [location.address_line_1, location.barangay, location.city].filter(Boolean).join(", ");

  return line ? `${headline} - ${line}` : headline;
}
