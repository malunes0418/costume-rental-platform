import { Router } from "express";
import { ReservationController } from "../controllers/ReservationController";
import { authMiddleware } from "../middleware/authMiddleware";
import { apiLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();
const controller = new ReservationController();

router.post("/cart", apiLimiter, authMiddleware, (req, res) => controller.addToCart(req, res));
router.post("/checkout", apiLimiter, authMiddleware, (req, res) => controller.checkout(req, res));
router.get("/my", apiLimiter, authMiddleware, (req, res) => controller.myReservations(req, res));

export default router;
