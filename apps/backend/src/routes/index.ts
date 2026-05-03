import auth from "./authRoutes";
import costumes from "./costumeRoutes";
import reservations from "./reservationRoutes";
import payments from "./paymentRoutes";
import notifications from "./notificationRoutes";
import wishlist from "./wishlistRoutes";
import reviews from "./reviewRoutes";
import vendor from "./vendorRoutes";
import admin from "./adminRoutes";
import subscriptions from "./subscriptionRoutes";
import { authMiddleware } from "../middleware/authMiddleware";

export default {
  auth,
  costumes,
  reservations,
  payments,
  notifications,
  wishlist,
  reviews,
  vendor,
  admin,
  subscriptions,
  authMiddleware
};
