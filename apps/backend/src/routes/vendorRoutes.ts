import { Router } from "express";
import { VendorController } from "../controllers/VendorController";
import { authMiddleware } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import { ensureApprovedVendor, ensureVendorApplicant } from "../middleware/vendorAccessMiddleware";

const router = Router();
const vendorController = new VendorController();

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

router.get("/reservations", ensureApprovedVendor, (req, res) => vendorController.listReservations(req, res));
router.post("/reservations/:id/approve", ensureApprovedVendor, (req, res) => vendorController.approveReservation(req, res));
router.post("/reservations/:id/reject", ensureApprovedVendor, (req, res) => vendorController.rejectReservation(req, res));

export default router;
