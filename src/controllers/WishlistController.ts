import { Request, Response } from "express";
import { WishlistService } from "../services/WishlistService";

const wishlistService = new WishlistService();

export class WishlistController {
  async add(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { costumeId } = req.body;
      const item = await wishlistService.addToWishlist(user.id, Number(costumeId));
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const costumeId = Number(req.params.costumeId);
      await wishlistService.removeFromWishlist(user.id, costumeId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const items = await wishlistService.listUserWishlist(user.id);
      res.json(items);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
}
