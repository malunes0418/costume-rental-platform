export type FulfillmentMode = "PICKUP" | "DELIVERY" | "BOTH";
export type FulfillmentMethod = "PICKUP" | "DELIVERY";
export type FulfillmentWindowSlot = "MORNING" | "AFTERNOON" | "EVENING";
export type PaymentPurpose = "INITIAL_RESERVATION" | "RESERVATION_ADJUSTMENT";
export type ReservationAdjustmentStatus = "PENDING" | "PAID" | "WAIVED" | "REJECTED";
export type ReservationFulfillmentApprovalStatus = "PENDING_VENDOR_REVIEW" | "APPROVED" | "REJECTED";

export type DeliveryProvider = "MANUAL" | "LALAMOVE";
export type LalamoveServiceType = "MOTORCYCLE" | "SEDAN" | "MPV" | "VAN" | "TRUCK175" | "TRUCK330";
export type DeliveryLeg = "OUTBOUND" | "RETURN";

export const LALAMOVE_SERVICE_TYPE_LABELS: Record<LalamoveServiceType, string> = {
  MOTORCYCLE: "Motorcycle",
  SEDAN: "Sedan",
  MPV: "MPV",
  VAN: "Van",
  TRUCK175: "Truck (175 kg)",
  TRUCK330: "Truck (330 kg)"
};

export const LALAMOVE_SERVICE_TYPES: LalamoveServiceType[] = [
  "MOTORCYCLE",
  "SEDAN",
  "MPV",
  "VAN",
  "TRUCK175",
  "TRUCK330"
];

export type DeliveryOrder = {
  id: number;
  reservation_id: number;
  leg: DeliveryLeg;
  lalamove_order_id?: string | null;
  quotation_id?: string | null;
  service_type?: string | null;
  status?: string | null;
  price_amount?: string | null;
  price_currency?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  share_link?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type LalamoveDispatchQuote = {
  quotation_id: string;
  price_amount: number;
  price_currency: string;
  service_type: string;
};

export type LalamoveDispatchQuoteResponse = {
  provider: "LALAMOVE" | "MANUAL";
  quote: LalamoveDispatchQuote | null;
};

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
  latitude?: number | null;
  longitude?: number | null;
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
  latitude?: number | null;
  longitude?: number | null;
  geocode_failed?: boolean | null;
  created_at?: string;
  updated_at?: string;
};

export type SavedLocationInput = Omit<SavedLocation, "id" | "user_id" | "created_at" | "updated_at">;

export type FulfillmentPreferences = {
  user_id: number;
  default_saved_location_id: number | null;
  default_delivery_window_slot: FulfillmentWindowSlot | null;
  default_return_window_slot: FulfillmentWindowSlot | null;
  created_at?: string;
  updated_at?: string;
};

export type FulfillmentPreferencesInput = {
  default_saved_location_id?: number | null;
  default_delivery_window_slot?: FulfillmentWindowSlot | null;
  default_return_window_slot?: FulfillmentWindowSlot | null;
};

export function normalizeSavedLocationId(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function hasCompleteDeliveryProfile(
  prefs: FulfillmentPreferences | null | undefined,
  locations: SavedLocation[]
): boolean {
  const locationId = normalizeSavedLocationId(prefs?.default_saved_location_id);
  return Boolean(
    locationId &&
      prefs?.default_delivery_window_slot &&
      prefs?.default_return_window_slot &&
      locations.some((location) => location.id === locationId)
  );
}

export function locationSelectionFromPreferences(
  prefs: FulfillmentPreferences,
  overrides?: {
    saved_location_id?: number | null;
    outbound_location?: ReservationFulfillmentLocationSelectionInput | null;
  }
): ReservationFulfillmentLocationSelectionInput {
  if (overrides?.outbound_location) {
    return overrides.outbound_location;
  }

  const savedLocationId =
    normalizeSavedLocationId(overrides?.saved_location_id) ??
    normalizeSavedLocationId(prefs.default_saved_location_id);

  if (!savedLocationId) {
    throw new Error("Choose a default delivery address in account settings.");
  }

  return { saved_location_id: savedLocationId };
}

export function buildFulfillmentPayloadFromPreferences(
  prefs: FulfillmentPreferences,
  effective: Pick<EffectiveCostumeFulfillment, "outbound_mode" | "return_mode">,
  overrides?: {
    saved_location_id?: number | null;
    delivery_window_slot?: FulfillmentWindowSlot;
    return_window_slot?: FulfillmentWindowSlot;
    outbound_location?: ReservationFulfillmentLocationSelectionInput | null;
    return_location?: ReservationFulfillmentLocationSelectionInput | null;
  }
): ReservationFulfillmentSelectionInput {
  const { outbound_method, return_method, use_same_location_for_return } =
    resolveDeliveryBookingMethods(effective);
  const deliverySlot = overrides?.delivery_window_slot ?? prefs.default_delivery_window_slot!;
  const returnSlot = overrides?.return_window_slot ?? prefs.default_return_window_slot!;
  const locationSelection = locationSelectionFromPreferences(prefs, overrides);

  const payload: ReservationFulfillmentSelectionInput = {
    outbound_method,
    return_method,
    return_window_slot: returnSlot,
    return_location: null,
    use_same_location_for_return
  };

  if (outbound_method === "DELIVERY") {
    payload.delivery_window_slot = deliverySlot;
    payload.outbound_location = locationSelection;
  } else {
    payload.pickup_window_slot = deliverySlot;
  }

  if (return_method === "DELIVERY" && !use_same_location_for_return) {
    payload.return_location = overrides?.return_location ?? locationSelection;
  }

  return payload;
}

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
  delivery_provider?: DeliveryProvider;
  lalamove_service_type?: LalamoveServiceType | null;
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
  delivery_provider?: DeliveryProvider;
  lalamove_service_type?: LalamoveServiceType | null;
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
  delivery_provider?: DeliveryProvider;
  lalamove_service_type?: LalamoveServiceType | null;
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
  return_fee_is_estimate?: boolean;
  outside_service_area: boolean;
  vendor_approval_status: ReservationFulfillmentApprovalStatus;
  vendor_approval_note?: string | null;
  outbound_dispatched_at?: string | null;
  outbound_dispatch_proof_url?: string | null;
  renter_received_at?: string | null;
  renter_received_proof_url?: string | null;
  return_initiated_at?: string | null;
  return_initiated_proof_url?: string | null;
  vendor_return_received_at?: string | null;
  vendor_return_proof_url?: string | null;
  delivery_provider?: DeliveryProvider;
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

/** Preferred outbound/return methods for the delivery-first renter booking flow. */
export function resolveDeliveryBookingMethods(
  effective: Pick<EffectiveCostumeFulfillment, "outbound_mode" | "return_mode">
): {
  outbound_method: FulfillmentMethod;
  return_method: FulfillmentMethod;
  use_same_location_for_return: boolean;
} {
  const outbound_method: FulfillmentMethod = modeAllowsMethod(effective.outbound_mode, "DELIVERY")
    ? "DELIVERY"
    : "PICKUP";
  const return_method: FulfillmentMethod = modeAllowsMethod(effective.return_mode, "DELIVERY")
    ? "DELIVERY"
    : "PICKUP";

  return {
    outbound_method,
    return_method,
    use_same_location_for_return: outbound_method === "DELIVERY" && return_method === "DELIVERY"
  };
}

export function fulfillmentFeesForBookingMethods(
  effective: Pick<
    EffectiveCostumeFulfillment,
    "outbound_pickup_fee" | "outbound_delivery_fee" | "return_pickup_fee" | "return_delivery_fee"
  >,
  methods: Pick<ReservationFulfillmentSelectionInput, "outbound_method" | "return_method">
) {
  const outboundFee =
    methods.outbound_method === "PICKUP"
      ? Number(effective.outbound_pickup_fee)
      : Number(effective.outbound_delivery_fee);
  const returnFee =
    methods.return_method === "PICKUP"
      ? Number(effective.return_pickup_fee)
      : Number(effective.return_delivery_fee);

  return outboundFee + returnFee;
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

export function locationMatchesServiceArea(
  location: Pick<LocationSnapshot, "area" | "city" | "province"> | null | undefined,
  serviceArea: ServiceAreaDefinition
) {
  if (!location) return false;

  const normalize = (value?: string | null) => value?.trim().toLocaleLowerCase() || null;
  const locationArea = normalize(location.area);
  const locationCity = normalize(location.city);
  const locationProvince = normalize(location.province);
  const serviceLabel = normalize(serviceArea.label);
  const serviceAreaValue = normalize(serviceArea.area);
  const serviceCity = normalize(serviceArea.city);
  const serviceProvince = normalize(serviceArea.province);

  if (serviceAreaValue && locationArea === serviceAreaValue) return true;
  if (serviceCity && locationCity === serviceCity) return true;
  if (serviceProvince && locationProvince === serviceProvince) return true;
  if (serviceLabel && (locationArea === serviceLabel || locationCity === serviceLabel)) return true;

  return false;
}

export function isLocationOutsideServiceAreas(
  location: Pick<LocationSnapshot, "area" | "city" | "province"> | null | undefined,
  serviceAreas: ServiceAreaDefinition[] | null | undefined
) {
  if (!location || !serviceAreas?.length) return false;
  return !serviceAreas.some((area) => locationMatchesServiceArea(location, area));
}

export function formatLocationSummary(location: LocationSnapshot | null | undefined) {
  if (!location) return "Location pending";

  const headline = location.label || location.area || location.city || "Saved location";
  const line = [location.address_line_1, location.barangay, location.city].filter(Boolean).join(", ");

  return line ? `${headline} - ${line}` : headline;
}
