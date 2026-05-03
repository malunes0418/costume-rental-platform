import { Request, Response } from "express";
import { SubscriptionService } from "../services/SubscriptionService";
import { ApiResponse } from "../helpers/ApiResponse";

export class SubscriptionController {
  private subscriptionService = new SubscriptionService();

  async getMySubscription(req: Request, res: Response) {
    try {
      const subscription = await this.subscriptionService.getActiveSubscription(req.user!.id);
      return ApiResponse.ok(res, subscription);
    } catch (error: unknown) {
      return ApiResponse.failFromError(res, error);
    }
  }

  async subscribe(req: Request, res: Response) {
    try {
      const { planName } = req.body;
      if (!planName) {
        return ApiResponse.fail(res, "Plan name is required");
      }
      const subscription = await this.subscriptionService.createSubscription(req.user!.id, planName);
      return ApiResponse.ok(res, subscription);
    } catch (error: unknown) {
      return ApiResponse.failFromError(res, error);
    }
  }
}
