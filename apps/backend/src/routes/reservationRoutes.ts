import { Router } from "express";
import { ReservationController } from "../controllers/ReservationController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
const controller = new ReservationController();

router.post("/cart", authMiddleware, (req, res) => controller.addToCart(req, res));
router.post("/checkout", authMiddleware, (req, res) => controller.checkout(req, res));
router.get("/my", authMiddleware, (req, res) => controller.myReservations(req, res));

export default router;
