import type {
  FulfillmentMethod,
  FulfillmentMode,
  FulfillmentWindowSlot,
  PaymentPurpose,
  ServiceAreaDefinition
} from "../domain/fulfillment";
import type { CostumeFulfillmentOverrideAttributes } from "../models/CostumeFulfillmentOverride";
import type { ReservationAdjustmentAttributes } from "../models/ReservationAdjustment";
import type { ReservationFulfillmentAttributes } from "../models/ReservationFulfillment";
import type { UserSavedLocationAttributes } from "../models/UserSavedLocation";
import type { VendorFulfillmentSettingsAttributes } from "../models/VendorFulfillmentSettings";

export interface VendorFulfillmentSettingsRequest {
  primary_location?: Record<string, unknown> | null;
  outbound_mode: VendorFulfillmentSettingsAttributes["outbound_mode"];
  return_mode: VendorFulfillmentSettingsAttributes["return_mode"];
  outbound_pickup_fee?: number | string;
  outbound_delivery_fee?: number | string;
  return_pickup_fee?: number | string;
  return_delivery_fee?: number | string;
  service_areas?: ServiceAreaDefinition[] | ServiceAreaDefinition | null;
}

export type VendorFulfillmentSettingsResponse = VendorFulfillmentSettingsAttributes | null;

export interface CostumeFulfillmentOverrideRequest {
  outbound_mode: FulfillmentMode;
  return_mode: FulfillmentMode;
}

export interface UserSavedLocationRequest {
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
  is_default?: boolean;
}

export type UserSavedLocationResponse = UserSavedLocationAttributes;
export type UserSavedLocationListResponse = UserSavedLocationAttributes[];

export interface ReservationPaymentMetadata {
  purpose: PaymentPurpose;
  reservation_adjustment_id?: number | null;
}

export interface ReservationFulfillmentLocationSelectionRequest {
  saved_location_id?: number | null;
  new_location?: UserSavedLocationRequest | null;
  save_as_default?: boolean;
}

export interface ReservationFulfillmentSelectionRequest {
  outbound_method: FulfillmentMethod;
  return_method: FulfillmentMethod;
  pickup_window_slot?: FulfillmentWindowSlot | null;
  delivery_window_slot?: FulfillmentWindowSlot | null;
  return_window_slot: FulfillmentWindowSlot;
  outbound_location?: ReservationFulfillmentLocationSelectionRequest | null;
  return_location?: ReservationFulfillmentLocationSelectionRequest | null;
  use_same_location_for_return?: boolean;
}

export interface PreparedReservationFulfillment {
  outbound_method: FulfillmentMethod;
  return_method: FulfillmentMethod;
  outbound_location_id?: number | null;
  outbound_location_snapshot: ReservationFulfillmentAttributes["outbound_location_snapshot"];
  return_location_id?: number | null;
  return_location_snapshot: ReservationFulfillmentAttributes["return_location_snapshot"];
  pickup_window_start?: Date | null;
  pickup_window_end?: Date | null;
  delivery_window_start?: Date | null;
  delivery_window_end?: Date | null;
  return_window_start?: Date | null;
  return_window_end?: Date | null;
  outbound_fee: number;
  return_fee: number;
  outside_service_area: boolean;
  vendor_approval_status: ReservationFulfillmentAttributes["vendor_approval_status"];
  vendor_approval_note?: string | null;
}

export interface EffectiveCostumeFulfillmentResponse {
  vendor_settings_configured: boolean;
  primary_location: VendorFulfillmentSettingsAttributes["primary_location"];
  service_areas: VendorFulfillmentSettingsAttributes["service_areas"];
  outbound_mode: FulfillmentMode;
  return_mode: FulfillmentMode;
  outbound_pickup_fee: number;
  outbound_delivery_fee: number;
  return_pickup_fee: number;
  return_delivery_fee: number;
  costume_override: CostumeFulfillmentOverrideAttributes | null;
}

export type ReservationFulfillmentResponse = ReservationFulfillmentAttributes | null;
export type ReservationAdjustmentResponse = ReservationAdjustmentAttributes[];
export type CostumeFulfillmentOverrideResponse = CostumeFulfillmentOverrideAttributes | null;
