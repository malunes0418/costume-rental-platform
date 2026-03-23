import { Request, Response } from "express";
import { ReviewService } from "../services/ReviewService";
import {
  ApiResponse,
  CreateOrUpdateReviewRequest,
  CreateOrUpdateReviewResponse,
  DeleteReviewResponse,
  ListCostumeReviewsResponse
} from "../dto";

const reviewService = new ReviewService();

export class ReviewController {
  async createOrUpdate(req: Request, res: Response) {
    try {
      const review = await reviewService.createOrUpdateReview(req.user!.id, req.body as CreateOrUpdateReviewRequest);
      ApiResponse.ok(res, review as CreateOrUpdateReviewResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listCostumeReviews(req: Request, res: Response) {
    try {
      const reviews = await reviewService.listCostumeReviews(req.params);
      ApiResponse.ok(res, reviews as ListCostumeReviewsResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await reviewService.deleteReview(req.user!.id, req.params);
      ApiResponse.ok(res, { success: true } as DeleteReviewResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }
}
