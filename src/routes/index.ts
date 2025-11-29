import { Router } from "express";
import authRoutes from "./authRoutes";
import costumeRoutes from "./costumeRoutes";
import reservationRoutes from "./reservationRoutes";
import paymentRoutes from "./paymentRoutes";
import notificationRoutes from "./notificationRoutes";
import wishlistRoutes from "./wishlistRoutes";
import reviewRoutes from "./reviewRoutes";
import adminRoutes from "./adminRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/costumes", costumeRoutes);
router.use("/reservations", reservationRoutes);
router.use("/payments", paymentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/reviews", reviewRoutes);
router.use("/admin", adminRoutes);

export default router;
