import { Review } from "../models/Review";
import { Costume } from "../models/Costume";
import { User } from "../models/User";

export class ReviewService {
  async createOrUpdateReview(userId: number, costumeId: number, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    let review = await Review.findOne({ where: { user_id: userId, costume_id: costumeId } });
    if (!review) {
      review = await Review.create({ user_id: userId, costume_id: costumeId, rating, comment });
    } else {
      review.rating = rating;
      review.comment = comment || "";
      await review.save();
    }
    return review;
  }

  async listCostumeReviews(costumeId: number) {
    return Review.findAll({
      where: { costume_id: costumeId },
      include: [User],
      order: [["created_at", "DESC"]]
    });
  }

  async deleteReview(userId: number, reviewId: number) {
    const review = await Review.findOne({ where: { id: reviewId, user_id: userId } });
    if (!review) {
      throw new Error("Review not found");
    }
    await review.destroy();
  }
}
