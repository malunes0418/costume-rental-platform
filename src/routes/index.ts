import auth from "./authRoutes";
import costumes from "./costumeRoutes";
import reservations from "./reservationRoutes";
import payments from "./paymentRoutes";
import notifications from "./notificationRoutes";
import wishlist from "./wishlistRoutes";
import reviews from "./reviewRoutes";
import admin from "./adminRoutes";
import { authMiddleware } from "../middleware/authMiddleware";

export default {
  auth,
  costumes,
  reservations,
  payments,
  notifications,
  wishlist,
  reviews,
  admin,
  authMiddleware
};
