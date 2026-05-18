export const FULFILLMENT_MODE_OPTIONS = ["PICKUP", "DELIVERY", "BOTH"] as const;
export type FulfillmentMode = (typeof FULFILLMENT_MODE_OPTIONS)[number];

export const FULFILLMENT_METHOD_OPTIONS = ["PICKUP", "DELIVERY"] as const;
export type FulfillmentMethod = (typeof FULFILLMENT_METHOD_OPTIONS)[number];

export const FULFILLMENT_WINDOW_SLOT_OPTIONS = ["MORNING", "AFTERNOON", "EVENING"] as const;
export type FulfillmentWindowSlot = (typeof FULFILLMENT_WINDOW_SLOT_OPTIONS)[number];

export const RESERVATION_ADJUSTMENT_TYPES = ["OUTSIDE_AREA_SURCHARGE"] as const;
export type ReservationAdjustmentType = (typeof RESERVATION_ADJUSTMENT_TYPES)[number];

export const RESERVATION_ADJUSTMENT_STATUSES = ["PENDING", "PAID", "WAIVED", "REJECTED"] as const;
export type ReservationAdjustmentStatus = (typeof RESERVATION_ADJUSTMENT_STATUSES)[number];

export const RESERVATION_FULFILLMENT_APPROVAL_STATUSES = [
  "PENDING_VENDOR_REVIEW",
  "APPROVED",
  "REJECTED"
] as const;
export type ReservationFulfillmentApprovalStatus = (typeof RESERVATION_FULFILLMENT_APPROVAL_STATUSES)[number];

export const PAYMENT_PURPOSE_OPTIONS = ["INITIAL_RESERVATION", "RESERVATION_ADJUSTMENT"] as const;
export type PaymentPurpose = (typeof PAYMENT_PURPOSE_OPTIONS)[number];

export type JsonObject = Record<string, unknown>;

export interface ServiceAreaDefinition extends JsonObject {
  label?: string | null;
  city?: string | null;
  province?: string | null;
  area?: string | null;
  notes?: string | null;
}

export interface LocationSnapshot extends JsonObject {
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
}

export function isFulfillmentMode(value: string): value is FulfillmentMode {
  return FULFILLMENT_MODE_OPTIONS.includes(value as FulfillmentMode);
}

export function isFulfillmentMethod(value: string): value is FulfillmentMethod {
  return FULFILLMENT_METHOD_OPTIONS.includes(value as FulfillmentMethod);
}

export function isFulfillmentWindowSlot(value: string): value is FulfillmentWindowSlot {
  return FULFILLMENT_WINDOW_SLOT_OPTIONS.includes(value as FulfillmentWindowSlot);
}

export function modeAllowsMethod(mode: FulfillmentMode, method: FulfillmentMethod) {
  return mode === "BOTH" || mode === method;
}

export function isModeNarrowerOrEqual(base: FulfillmentMode, candidate: FulfillmentMode) {
  if (base === "BOTH") {
    return true;
  }

  return base === candidate;
}

function normalizeComparable(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase() || null;
}

export function locationMatchesServiceArea(
  location: Pick<LocationSnapshot, "area" | "city" | "province"> | null | undefined,
  serviceArea: ServiceAreaDefinition
) {
  if (!location) return false;

  const locationArea = normalizeComparable(location.area);
  const locationCity = normalizeComparable(location.city);
  const locationProvince = normalizeComparable(location.province);

  const serviceLabel = normalizeComparable(serviceArea.label);
  const serviceAreaValue = normalizeComparable(serviceArea.area);
  const serviceCity = normalizeComparable(serviceArea.city);
  const serviceProvince = normalizeComparable(serviceArea.province);

  if (serviceAreaValue && locationArea === serviceAreaValue) return true;
  if (serviceCity && locationCity === serviceCity) return true;
  if (serviceProvince && locationProvince === serviceProvince) return true;
  if (serviceLabel && (locationArea === serviceLabel || locationCity === serviceLabel)) return true;

  return false;
}

export function buildWindowRange(date: string, slot: FulfillmentWindowSlot) {
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T00:00:00`);

  if (slot === "MORNING") {
    start.setHours(9, 0, 0, 0);
    end.setHours(12, 0, 0, 0);
  } else if (slot === "AFTERNOON") {
    start.setHours(13, 0, 0, 0);
    end.setHours(16, 0, 0, 0);
  } else {
    start.setHours(17, 0, 0, 0);
    end.setHours(20, 0, 0, 0);
  }

  return { start, end };
}
