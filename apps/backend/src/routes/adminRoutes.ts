import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";

const router = Router();
const controller = new AdminController();

router.get("/overview", authMiddleware, adminMiddleware, (req, res) => controller.getOverview(req, res));

router.get("/reservations", authMiddleware, adminMiddleware, (req, res) => controller.listReservations(req, res));
router.patch("/reservations/:id/status", authMiddleware, adminMiddleware, (req, res) =>
  controller.updateReservationStatus(req, res)
);

router.get("/inventory", authMiddleware, adminMiddleware, (req, res) => controller.listInventory(req, res));
router.post("/inventory/bulk-status", authMiddleware, adminMiddleware, (req, res) =>
  controller.bulkUpdateCostumeStatus(req, res)
);
router.get("/inventory/:id", authMiddleware, adminMiddleware, (req, res) => controller.getInventoryItem(req, res));

router.get("/users", authMiddleware, adminMiddleware, (req, res) => controller.listUsers(req, res));
router.patch("/users/:id/role", authMiddleware, adminMiddleware, (req, res) => controller.updateUserRole(req, res));

router.get("/vendors", authMiddleware, adminMiddleware, (req, res) => controller.listAllVendors(req, res));
router.get("/vendors/pending", authMiddleware, adminMiddleware, (req, res) =>
  controller.listPendingVendors(req, res)
);
router.post("/vendors/:userId/approve", authMiddleware, adminMiddleware, (req, res) =>
  controller.approveVendor(req, res)
);
router.post("/vendors/:userId/reject", authMiddleware, adminMiddleware, (req, res) =>
  controller.rejectVendor(req, res)
);
router.patch("/costumes/:id/status", authMiddleware, adminMiddleware, (req, res) =>
  controller.updateCostumeStatus(req, res)
);

// Moderation
router.get("/moderation/queue", authMiddleware, adminMiddleware, (req, res) =>
  controller.getModerationQueue(req, res)
);
router.post("/moderation/reports", authMiddleware, adminMiddleware, (req, res) =>
  controller.createContentReport(req, res)
);
router.patch("/moderation/reports/:id/resolve", authMiddleware, adminMiddleware, (req, res) =>
  controller.resolveContentReport(req, res)
);

// Audit
router.get("/audit", authMiddleware, adminMiddleware, (req, res) => controller.listAuditLogs(req, res));
router.get("/audit/:id", authMiddleware, adminMiddleware, (req, res) => controller.getAuditLog(req, res));

// Disputes
router.get("/disputes", authMiddleware, adminMiddleware, (req, res) => controller.listDisputes(req, res));
router.post("/disputes", authMiddleware, adminMiddleware, (req, res) => controller.createDispute(req, res));
router.get("/disputes/:id", authMiddleware, adminMiddleware, (req, res) => controller.getDispute(req, res));
router.patch("/disputes/:id/status", authMiddleware, adminMiddleware, (req, res) =>
  controller.updateDisputeStatus(req, res)
);
router.post("/disputes/:id/messages", authMiddleware, adminMiddleware, (req, res) =>
  controller.addDisputeMessage(req, res)
);

// Payouts
router.get("/payouts/balances", authMiddleware, adminMiddleware, (req, res) =>
  controller.listVendorBalances(req, res)
);
router.get("/payouts/vendors/:vendorId", authMiddleware, adminMiddleware, (req, res) =>
  controller.getVendorPayoutDetail(req, res)
);
router.get("/payouts", authMiddleware, adminMiddleware, (req, res) => controller.listPayouts(req, res));
router.post("/payouts/sync", authMiddleware, adminMiddleware, (req, res) =>
  controller.syncEarningEntries(req, res)
);
router.post("/payouts/entries/:id/hold", authMiddleware, adminMiddleware, (req, res) =>
  controller.holdEarningEntry(req, res)
);
router.post("/payouts/entries/:id/release", authMiddleware, adminMiddleware, (req, res) =>
  controller.releaseEarningEntry(req, res)
);
router.post("/payouts", authMiddleware, adminMiddleware, (req, res) => controller.createPayout(req, res));
router.post("/payouts/:id/paid", authMiddleware, adminMiddleware, (req, res) =>
  controller.markPayoutPaid(req, res)
);
router.post("/payouts/:id/failed", authMiddleware, adminMiddleware, (req, res) =>
  controller.markPayoutFailed(req, res)
);

// Settings
router.get("/settings", authMiddleware, adminMiddleware, (req, res) => controller.getSettings(req, res));
router.patch("/settings", authMiddleware, adminMiddleware, (req, res) => controller.updateSettings(req, res));

export default router;
