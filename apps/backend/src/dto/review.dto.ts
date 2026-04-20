import type { SuccessResponse } from "./common.dto";
import type { UserSummary } from "./shared.dto";
import type { ReviewAttributes } from "../models/Review";

export interface CreateOrUpdateReviewRequest {
  costumeId: number;
  rating: number;
  comment?: string;
}

export interface ReviewWithUser extends ReviewAttributes {
  User?: UserSummary;
}

export type CreateOrUpdateReviewResponse = ReviewAttributes;

export type ListCostumeReviewsResponse = ReviewWithUser[];

export type DeleteReviewResponse = SuccessResponse;
