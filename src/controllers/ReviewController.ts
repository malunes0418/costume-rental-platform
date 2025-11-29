import { Request, Response } from "express";
import { ReviewService } from "../services/ReviewService";

const reviewService = new ReviewService();

export class ReviewController {
  async createOrUpdate(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { costumeId, rating, comment } = req.body;
      const review = await reviewService.createOrUpdateReview(user.id, Number(costumeId), Number(rating), comment);
      res.json(review);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async listCostumeReviews(req: Request, res: Response) {
    try {
      const costumeId = Number(req.params.costumeId);
      const reviews = await reviewService.listCostumeReviews(costumeId);
      res.json(reviews);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = Number(req.params.id);
      await reviewService.deleteReview(user.id, id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
}
