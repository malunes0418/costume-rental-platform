import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";

const router = Router();
const controller = new AdminController();

router.post("/payments/review", authMiddleware, adminMiddleware, (req, res) => controller.reviewPayment(req, res));
router.get("/reservations", authMiddleware, adminMiddleware, (req, res) => controller.listReservations(req, res));
router.patch("/reservations/:id/status", authMiddleware, adminMiddleware, (req, res) => controller.updateReservationStatus(req, res));
router.get("/payments", authMiddleware, adminMiddleware, (req, res) => controller.listPayments(req, res));
router.get("/inventory", authMiddleware, adminMiddleware, (req, res) => controller.listInventory(req, res));
router.get("/users", authMiddleware, adminMiddleware, (req, res) => controller.listUsers(req, res));
router.patch("/users/:id/role", authMiddleware, adminMiddleware, (req, res) => controller.updateUserRole(req, res));

// Vendor Moderation
router.get("/vendors", authMiddleware, adminMiddleware, (req, res) => controller.listAllVendors(req, res));
router.get("/vendors/pending", authMiddleware, adminMiddleware, (req, res) => controller.listPendingVendors(req, res));
router.post("/vendors/:userId/approve", authMiddleware, adminMiddleware, (req, res) => controller.approveVendor(req, res));
router.post("/vendors/:userId/reject", authMiddleware, adminMiddleware, (req, res) => controller.rejectVendor(req, res));
router.patch("/costumes/:id/status", authMiddleware, adminMiddleware, (req, res) => controller.updateCostumeStatus(req, res));

export default router;
