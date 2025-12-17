import { Router } from "express";
import { NotificationController } from "../controllers/NotificationController";
import { authMiddleware } from "../middleware/authMiddleware";
import { apiLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();
const controller = new NotificationController();

router.get("/", apiLimiter, authMiddleware, (req, res) => controller.list(req, res));
router.post("/:id/read", apiLimiter, authMiddleware, (req, res) => controller.markAsRead(req, res));

export default router;
