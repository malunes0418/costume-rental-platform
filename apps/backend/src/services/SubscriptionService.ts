import { Subscription } from "../models/Subscription";
import { Op } from "sequelize";

export class SubscriptionService {
  async getActiveSubscription(userId: number) {
    return Subscription.findOne({
      where: {
        user_id: userId,
        status: { [Op.in]: ["ACTIVE", "TRIALING"] },
        end_date: { [Op.gt]: new Date() }
      }
    });
  }

  async createSubscription(userId: number, planName: string, days: number = 30) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return Subscription.create({
      user_id: userId,
      plan_name: planName,
      status: "ACTIVE",
      start_date: startDate,
      end_date: endDate
    });
  }
}
