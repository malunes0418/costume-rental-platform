import { Router } from "express";
import { SubscriptionController } from "../controllers/SubscriptionController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
const controller = new SubscriptionController();

router.get("/me", authMiddleware, (req, res) => controller.getMySubscription(req, res));
router.post("/subscribe", authMiddleware, (req, res) => controller.subscribe(req, res));

export default router;
