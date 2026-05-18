import type { ReservationFulfillmentSelectionRequest } from "./fulfillment.dto";
import type { CostumeAttributes } from "../models/Costume";
import type { ReservationAdjustmentAttributes } from "../models/ReservationAdjustment";
import type { ReservationFulfillmentAttributes } from "../models/ReservationFulfillment";
import type { ReservationAttributes } from "../models/Reservation";
import type { ReservationItemAttributes } from "../models/ReservationItem";

export interface AddToCartRequest {
  costumeId: number;
  quantity?: number;
  startDate: string;
  endDate: string;
  fulfillment: ReservationFulfillmentSelectionRequest;
}

export interface CheckoutRequest {
  reservationId: number;
}

export interface RemoveReservationResponse {
  success: true;
}

export interface ReservationItemWithCostume extends ReservationItemAttributes {
  Costume?: CostumeAttributes;
}

export interface ReservationWithItems extends ReservationAttributes {
  items?: ReservationItemWithCostume[];
  fulfillment?: ReservationFulfillmentAttributes | null;
  adjustments?: ReservationAdjustmentAttributes[];
}

export interface AddToCartResponse {
  reservation: ReservationWithItems;
  item: ReservationItemAttributes;
}

export type CheckoutResponse = ReservationWithItems;

export type MyReservationsResponse = ReservationWithItems[];
