import { Router, Request, Response } from "express";
import { env } from "../config/env";
import { LalamoveWebhookService } from "../services/lalamove/LalamoveWebhookService";

const router = Router();
const lalamoveWebhookService = new LalamoveWebhookService();

/**
 * POST /api/webhooks/lalamove/:token
 *
 * Receives Lalamove webhook events. Unauthenticated — the token in the URL
 * path acts as the shared secret (LALAMOVE_WEBHOOK_TOKEN env var).
 * Always returns 200 so Lalamove does not retry unnecessarily.
 */
router.post("/lalamove/:token", async (req: Request, res: Response) => {
  // Token validation
  const expectedToken = env.lalamoveWebhookToken;
  if (!expectedToken || req.params.token !== expectedToken) {
    // Return 200 to avoid exposing whether the token is valid
    res.status(200).end();
    return;
  }

  // Process asynchronously after responding so Lalamove gets 200 quickly
  res.status(200).end();

  try {
    await lalamoveWebhookService.handleWebhook(req.body);
  } catch (err) {
    console.error("[LalamoveWebhook] Error processing webhook:", err);
  }
});

export default router;
