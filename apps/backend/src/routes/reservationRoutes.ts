import { Router } from "express";
import { ReservationController } from "../controllers/ReservationController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
const controller = new ReservationController();

router.post("/cart", authMiddleware, (req, res) => controller.addToCart(req, res));
router.post("/checkout", authMiddleware, (req, res) => controller.checkout(req, res));
router.get("/:id/messages", authMiddleware, (req, res) => controller.listMessages(req, res));
router.post("/:id/messages", authMiddleware, (req, res) => controller.createMessage(req, res));
router.delete("/:id", authMiddleware, (req, res) => controller.removeReservation(req, res));
router.get("/my", authMiddleware, (req, res) => controller.myReservations(req, res));

export default router;
