import type { Request } from "express";
import type { AddWishlistRequest } from "../dto";
import { WishlistItem } from "../models/WishlistItem";
import { Costume } from "../models/Costume";

export class WishlistService {
  async addToWishlist(userId: number, body: AddWishlistRequest) {
    const costumeId = Number(body.costumeId);
    const existing = await WishlistItem.findOne({ where: { user_id: userId, costume_id: costumeId } });
    if (existing) {
      return existing;
    }
    return WishlistItem.create({ user_id: userId, costume_id: costumeId });
  }

  async removeFromWishlist(userId: number, params: Request["params"]) {
    await WishlistItem.destroy({ where: { user_id: userId, costume_id: Number(params.costumeId) } });
  }

  async listUserWishlist(userId: number) {
    return WishlistItem.findAll({ where: { user_id: userId }, include: [Costume] });
  }
}
