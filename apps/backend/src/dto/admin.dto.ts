import type { CostumeAttributes } from "../models/Costume";
import type { UserPublic } from "./shared.dto";
import type { ReservationWithItems } from "./reservation.dto";

/** Admin list row: cart/reservation lines plus optional customer. */
export type AdminReservationRow = ReservationWithItems & { User?: UserPublic };

export type AdminListReservationsResponse = AdminReservationRow[];

export type AdminListInventoryResponse = CostumeAttributes[];

export type AdminListUsersResponse = UserPublic[];
