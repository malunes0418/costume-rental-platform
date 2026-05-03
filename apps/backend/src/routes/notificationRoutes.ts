import { Router } from "express";
import { NotificationController } from "../controllers/NotificationController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
const controller = new NotificationController();

router.get("/", authMiddleware, (req, res) => controller.list(req, res));
router.post("/read-all", authMiddleware, (req, res) => controller.markAllAsRead(req, res));
router.post("/:id/read", authMiddleware, (req, res) => controller.markAsRead(req, res));

export default router;
