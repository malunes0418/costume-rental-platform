import { Router } from "express";
import { VendorController } from "../controllers/VendorController";
import { authMiddleware } from "../middleware/authMiddleware";
import { subscriptionMiddleware } from "../middleware/subscriptionMiddleware";

const router = Router();
const vendorController = new VendorController();

// Middleware to check if user is an approved vendor
const isVendor = (req: any, res: any, next: any) => {
  if (req.user && req.user.vendor_status === "APPROVED") {
    next();
  } else {
    res.status(403).json({ success: false, error: "Vendor access required" });
  }
};

/**
 * Vendor Application
 * (No subscription check here, as they are not yet vendors)
 */
router.post("/apply", authMiddleware, (req, res) => vendorController.apply(req, res));
router.get("/me", authMiddleware, (req, res) => vendorController.getProfile(req, res));

/**
 * Vendor Listings & Reservations
 * Requires: Authentication + Approved Vendor Status + Active Subscription
 */
router.use(authMiddleware, isVendor, subscriptionMiddleware);

// Vendor Listings
router.get("/costumes", (req, res) => vendorController.listCostumes(req, res));
router.post("/costumes", (req, res) => vendorController.createCostume(req, res));
router.put("/costumes/:id", (req, res) => vendorController.updateCostume(req, res));
router.delete("/costumes/:id", (req, res) => vendorController.deleteCostume(req, res));

// Vendor Reservations
router.get("/reservations", (req, res) => vendorController.listReservations(req, res));
router.post("/reservations/:id/approve", (req, res) => vendorController.approveReservation(req, res));
router.post("/reservations/:id/reject", (req, res) => vendorController.rejectReservation(req, res));

// Messaging
router.get("/reservations/:id/messages", (req, res) => vendorController.listMessages(req, res));
router.post("/reservations/:id/messages", (req, res) => vendorController.createMessage(req, res));

export default router;
