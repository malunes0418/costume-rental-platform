import type { CostumeAttributes } from "../models/Costume";
import type { ReservationAttributes } from "../models/Reservation";
import type { ReservationItemAttributes } from "../models/ReservationItem";

export interface AddToCartRequest {
  costumeId: number;
  quantity: number;
  startDate: string;
  endDate: string;
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
}

export interface AddToCartResponse {
  reservation: ReservationWithItems;
  item: ReservationItemAttributes;
}

export type CheckoutResponse = ReservationWithItems;

export type MyReservationsResponse = ReservationWithItems[];
