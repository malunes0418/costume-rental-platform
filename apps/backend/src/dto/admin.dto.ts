import type { CostumeAttributes } from "../models/Costume";
import type { PaymentAttributes } from "../models/Payment";
import type { ReservationAttributes } from "../models/Reservation";
import type { UserPublic } from "./shared.dto";
import type { ReservationWithItems } from "./reservation.dto";

export interface AdminReviewPaymentRequest {
  paymentId: number;
  approve: boolean;
  notes?: string;
}

export interface AdminReviewPaymentResponse {
  payment: PaymentAttributes;
  reservations: ReservationAttributes[];
}

/** Admin list row: cart/reservation lines plus optional customer. */
export type AdminReservationRow = ReservationWithItems & { User?: UserPublic };

export type AdminListReservationsResponse = AdminReservationRow[];

export interface AdminPaymentRow extends PaymentAttributes {
  Reservation?: ReservationAttributes;
  User?: UserPublic;
}

export type AdminListPaymentsResponse = AdminPaymentRow[];

export type AdminListInventoryResponse = CostumeAttributes[];

export type AdminListUsersResponse = UserPublic[];
