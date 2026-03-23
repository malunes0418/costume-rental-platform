import type { Request } from "express";
import type { CreateOrUpdateReviewRequest } from "../dto";
import { Review } from "../models/Review";
import { Costume } from "../models/Costume";
import { User } from "../models/User";

export class ReviewService {
  async createOrUpdateReview(userId: number, body: CreateOrUpdateReviewRequest) {
    const { costumeId, rating, comment } = body;
    const costumeIdNum = Number(costumeId);
    const ratingNum = Number(rating);
    let review = await Review.findOne({ where: { user_id: userId, costume_id: costumeIdNum } });
    if (!review) {
      review = await Review.create({ user_id: userId, costume_id: costumeIdNum, rating: ratingNum, comment });
    } else {
      review.rating = ratingNum;
      review.comment = comment || "";
      await review.save();
    }
    return review;
  }

  async listCostumeReviews(params: Request["params"]) {
    return Review.findAll({
      where: { costume_id: Number(params.costumeId) },
      include: [User],
      order: [["created_at", "DESC"]]
    });
  }

  async deleteReview(userId: number, params: Request["params"]) {
    const review = await Review.findOne({ where: { id: Number(params.id), user_id: userId } });
    if (!review) {
      throw new Error("Review not found");
    }
    await review.destroy();
  }
}
