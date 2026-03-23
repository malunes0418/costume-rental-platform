import type { SuccessResponse } from "./common.dto";
import type { CostumeAttributes } from "../models/Costume";
import type { WishlistItemAttributes } from "../models/WishlistItem";

export interface AddWishlistRequest {
  costumeId: number;
}

export interface WishlistItemWithCostume extends WishlistItemAttributes {
  Costume?: CostumeAttributes;
}

export type AddWishlistResponse = WishlistItemAttributes;

export type ListWishlistResponse = WishlistItemWithCostume[];

export type RemoveWishlistResponse = SuccessResponse;
