import { WishlistItem } from "../models/WishlistItem";
import { Costume } from "../models/Costume";

export class WishlistService {
  async addToWishlist(userId: number, costumeId: number) {
    const existing = await WishlistItem.findOne({ where: { user_id: userId, costume_id: costumeId } });
    if (existing) {
      return existing;
    }
    return WishlistItem.create({ user_id: userId, costume_id: costumeId });
  }

  async removeFromWishlist(userId: number, costumeId: number) {
    await WishlistItem.destroy({ where: { user_id: userId, costume_id: costumeId } });
  }

  async listUserWishlist(userId: number) {
    return WishlistItem.findAll({ where: { user_id: userId }, include: [Costume] });
  }
}
