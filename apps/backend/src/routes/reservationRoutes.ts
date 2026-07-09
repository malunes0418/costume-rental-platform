import { Router } from "express";
import { ReservationController } from "../controllers/ReservationController";
import { authMiddleware } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";

const router = Router();
const controller = new ReservationController();

router.post("/cart", authMiddleware, (req, res) => controller.addToCart(req, res));
router.post("/cart/items", authMiddleware, (req, res) => controller.addCostumeToCart(req, res));
router.patch("/cart/:reservationId", authMiddleware, (req, res) => controller.configureCartReservation(req, res));
router.post("/checkout", authMiddleware, (req, res) => controller.checkout(req, res));
router.get("/my", authMiddleware, (req, res) => controller.myReservations(req, res));
router.get("/:id/delivery", authMiddleware, (req, res) => controller.getDeliveryStatus(req, res));
router.get("/:id/handoff-proofs/:type", authMiddleware, (req, res) => controller.handoffProof(req, res));
router.post("/:id/confirm-received", authMiddleware, upload.single("proof"), (req, res) =>
  controller.confirmReceived(req, res)
);
router.post("/:id/initiate-return", authMiddleware, upload.single("proof"), (req, res) =>
  controller.initiateReturn(req, res)
);
router.post("/:id/cancel", authMiddleware, (req, res) => controller.cancelReservation(req, res));
router.get("/:id/messages", authMiddleware, (req, res) => controller.listMessages(req, res));
router.post("/:id/messages", authMiddleware, (req, res) => controller.createMessage(req, res));
router.delete("/:id", authMiddleware, (req, res) => controller.removeReservation(req, res));

export default router;
