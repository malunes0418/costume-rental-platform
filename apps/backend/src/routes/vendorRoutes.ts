import { Router } from "express";
import { VendorController } from "../controllers/VendorController";
import { FulfillmentController } from "../controllers/FulfillmentController";
import { authMiddleware } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import { ensureApprovedVendor, ensureVendorApplicant } from "../middleware/vendorAccessMiddleware";

const router = Router();
const vendorController = new VendorController();
const fulfillmentController = new FulfillmentController();

router.post("/apply", authMiddleware, upload.single("id_document"), (req, res) => vendorController.apply(req, res));
router.get("/me", authMiddleware, (req, res) => vendorController.getProfile(req, res));
router.get("/reservations/:id/messages", authMiddleware, (req, res) => vendorController.listMessages(req, res));
router.post("/reservations/:id/messages", authMiddleware, (req, res) => vendorController.createMessage(req, res));

router.use(authMiddleware, ensureVendorApplicant);

router.get("/costumes", (req, res) => vendorController.listCostumes(req, res));
router.post("/costumes", (req, res) => vendorController.createCostume(req, res));
router.put("/costumes/:id", (req, res) => vendorController.updateCostume(req, res));
router.delete("/costumes/:id", (req, res) => vendorController.deleteCostume(req, res));
router.post("/costumes/:id/publish", ensureApprovedVendor, (req, res) => vendorController.publishCostume(req, res));
router.post("/costumes/:id/unpublish", ensureApprovedVendor, (req, res) => vendorController.unpublishCostume(req, res));
router.get("/fulfillment-settings", (req, res) => fulfillmentController.getVendorSettings(req, res));
router.put("/fulfillment-settings", (req, res) => fulfillmentController.upsertVendorSettings(req, res));

router.get("/reservations", ensureApprovedVendor, (req, res) => vendorController.listReservations(req, res));
router.post("/reservations/:id/approve", ensureApprovedVendor, (req, res) => vendorController.approveReservation(req, res));
router.post("/reservations/:id/reject", ensureApprovedVendor, (req, res) => vendorController.rejectReservation(req, res));
router.post("/reservations/:id/surcharge", ensureApprovedVendor, (req, res) => vendorController.requestReservationSurcharge(req, res));
router.post("/reservations/:id/lifecycle", ensureApprovedVendor, (req, res) => vendorController.advanceReservationLifecycle(req, res));

export default router;
