import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { adminLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();
const controller = new AdminController();

router.post("/payments/review", adminLimiter, authMiddleware, adminMiddleware, (req, res) => controller.reviewPayment(req, res));
router.get("/reservations", adminLimiter, authMiddleware, adminMiddleware, (req, res) => controller.listReservations(req, res));
router.get("/payments", adminLimiter, authMiddleware, adminMiddleware, (req, res) => controller.listPayments(req, res));
router.get("/inventory", adminLimiter, authMiddleware, adminMiddleware, (req, res) => controller.listInventory(req, res));

export default router;
