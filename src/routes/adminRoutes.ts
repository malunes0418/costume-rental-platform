import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";

const router = Router();
const controller = new AdminController();

router.post("/payments/review", authMiddleware, adminMiddleware, (req, res) => controller.reviewPayment(req, res));
router.get("/reservations", authMiddleware, adminMiddleware, (req, res) => controller.listReservations(req, res));
router.get("/payments", authMiddleware, adminMiddleware, (req, res) => controller.listPayments(req, res));
router.get("/inventory", authMiddleware, adminMiddleware, (req, res) => controller.listInventory(req, res));

export default router;
