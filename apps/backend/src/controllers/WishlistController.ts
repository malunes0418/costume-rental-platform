import { Request, Response } from "express";
import { WishlistService } from "../services/WishlistService";
import {
  AddWishlistRequest,
  AddWishlistResponse,
  ApiResponse,
  ListWishlistResponse,
  RemoveWishlistResponse
} from "../dto";

const wishlistService = new WishlistService();

export class WishlistController {
  async add(req: Request, res: Response) {
    try {
      const item = await wishlistService.addToWishlist(req.user!.id, req.body as AddWishlistRequest);
      ApiResponse.ok(res, item as AddWishlistResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      await wishlistService.removeFromWishlist(req.user!.id, req.params);
      ApiResponse.ok(res, { success: true } as RemoveWishlistResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async list(req: Request, res: Response) {
    try {
      const items = await wishlistService.listUserWishlist(req.user!.id);
      ApiResponse.ok(res, items as ListWishlistResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }
}
