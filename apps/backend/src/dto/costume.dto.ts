import type { PaginatedResult } from "./common.dto";
import type { CostumeAttributes } from "../models/Costume";
import type { CostumeImageAttributes } from "../models/CostumeImage";
import type { ReservationAttributes } from "../models/Reservation";
import type { ReservationItemAttributes } from "../models/ReservationItem";

/** Query for `GET /costumes`. */
export interface CostumeListQuery {
  q?: string;
  category?: string;
  size?: string;
  gender?: string;
  theme?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

/** Query for `GET /costumes/:id/availability`. */
export interface CostumeAvailabilityQuery {
  startDate: string;
  endDate: string;
}

/** Sequelize includes nested images under pluralized model name. */
export interface CostumeWithImages extends CostumeAttributes {
  CostumeImages?: CostumeImageAttributes[];
}

export type CostumeListResponse = PaginatedResult<CostumeWithImages>;

export interface CostumeDetailResponse {
  costume: CostumeWithImages;
  ratingCount: number;
  avgRating: number | null;
}

export interface ReservationWithItemsForAvailability extends ReservationAttributes {
  items?: ReservationItemAttributes[];
}

export type CostumeAvailabilityResponse = ReservationWithItemsForAvailability[];
