import { Router, Request, Response } from "express";
import crypto from "crypto";
import { env } from "../config/env";
import { LalamoveWebhookService } from "../services/lalamove/LalamoveWebhookService";

const router = Router();
const lalamoveWebhookService = new LalamoveWebhookService();

function tokensMatch(provided: string, expected: string) {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * POST /api/webhooks/lalamove/:token
 *
 * Shared secret in URL path (plus optional LALAMOVE_WEBHOOK_HMAC_SECRET header HMAC).
 * Processes synchronously so failures can return non-2xx and allow provider retries.
 */
router.post("/lalamove/:token", async (req: Request, res: Response) => {
  const expectedToken = env.lalamoveWebhookToken;
  if (!expectedToken || !tokensMatch(String(req.params.token || ""), expectedToken)) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const hmacSecret = process.env.LALAMOVE_WEBHOOK_HMAC_SECRET;
  if (hmacSecret) {
    const signature = String(req.get("X-Lalamove-Signature") || "");
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
    const digest = crypto.createHmac("sha256", hmacSecret).update(rawBody).digest("hex");
    if (!signature || !tokensMatch(signature, digest)) {
      res.status(401).json({ message: "Invalid signature" });
      return;
    }
  }

  try {
    await lalamoveWebhookService.handleWebhook(req.body);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[LalamoveWebhook] Error processing webhook:", err);
    res.status(500).json({ message: "Webhook processing failed" });
  }
});

export default router;
