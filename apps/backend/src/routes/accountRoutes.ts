import { Router } from "express";
import { AccountController } from "../controllers/AccountController";
import { FulfillmentController } from "../controllers/FulfillmentController";
import { upload } from "../middleware/uploadMiddleware";

const router = Router();
const accountController = new AccountController();
const fulfillmentController = new FulfillmentController();

router.put("/profile", (req, res) => accountController.updateProfile(req, res));
router.post("/avatar", upload.single("avatar"), (req, res) => accountController.updateAvatar(req, res));
router.put("/password", (req, res) => accountController.changePassword(req, res));
router.get("/notification-preferences", (req, res) => accountController.getNotificationPreferences(req, res));
router.put("/notification-preferences", (req, res) => accountController.updateNotificationPreferences(req, res));
router.get("/platform-settings", (req, res) => accountController.getPlatformSettings(req, res));

router.get("/locations", (req, res) => fulfillmentController.listSavedLocations(req, res));
router.post("/locations", (req, res) => fulfillmentController.createSavedLocation(req, res));
router.put("/locations/:id", (req, res) => fulfillmentController.updateSavedLocation(req, res));
router.delete("/locations/:id", (req, res) => fulfillmentController.deleteSavedLocation(req, res));

router.get("/fulfillment-preferences", (req, res) => fulfillmentController.getFulfillmentPreferences(req, res));
router.put("/fulfillment-preferences", (req, res) => fulfillmentController.upsertFulfillmentPreferences(req, res));

export default router;
