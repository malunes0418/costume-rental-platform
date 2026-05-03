import { Request, Response, NextFunction } from "express";
import { SubscriptionService } from "../services/SubscriptionService";

const subscriptionService = new SubscriptionService();

export async function subscriptionMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  // Only vendors need to check for subscriptions
  // Admins are exempt
  if (req.user.role === "ADMIN") {
    return next();
  }

  const subscription = await subscriptionService.getActiveSubscription(req.user.id);
  if (!subscription) {
    return res.status(403).json({
      success: false,
      error: "Active subscription required",
      code: "SUBSCRIPTION_REQUIRED"
    });
  }

  next();
}
