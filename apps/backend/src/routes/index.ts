import auth from "./authRoutes";
import health from "./healthRoutes";
import costumes from "./costumeRoutes";
import reservations from "./reservationRoutes";
import payments from "./paymentRoutes";
import notifications from "./notificationRoutes";
import wishlist from "./wishlistRoutes";
import reviews from "./reviewRoutes";
import vendor from "./vendorRoutes";
import admin from "./adminRoutes";
import subscriptions from "./subscriptionRoutes";
import account from "./accountRoutes";
import webhooks from "./webhookRoutes";
import { authMiddleware } from "../middleware/authMiddleware";

export default {
  auth,
  health,
  costumes,
  reservations,
  payments,
  notifications,
  wishlist,
  reviews,
  vendor,
  admin,
  account,
  subscriptions,
  webhooks,
  authMiddleware
};
