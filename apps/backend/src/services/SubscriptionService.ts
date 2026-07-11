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

  async createSubscription(userId: number, planName: string, _days: number = 30) {
    const allowedPlans = new Set(["BASIC", "PRO", "ENTERPRISE"]);
    const normalized = String(planName || "").trim().toUpperCase();
    if (!allowedPlans.has(normalized)) {
      throw new Error("Invalid subscription plan");
    }

    // Billing is not wired yet — refuse free self-activation.
    throw new Error(
      "Paid subscription checkout is not available yet. Contact support to activate a plan."
    );
  }
}
