import { Router } from "express";
import { FulfillmentController } from "../controllers/FulfillmentController";

const router = Router();
const controller = new FulfillmentController();

router.get("/locations", (req, res) => controller.listSavedLocations(req, res));
router.post("/locations", (req, res) => controller.createSavedLocation(req, res));
router.put("/locations/:id", (req, res) => controller.updateSavedLocation(req, res));
router.delete("/locations/:id", (req, res) => controller.deleteSavedLocation(req, res));

router.get("/fulfillment-preferences", (req, res) => controller.getFulfillmentPreferences(req, res));
router.put("/fulfillment-preferences", (req, res) => controller.upsertFulfillmentPreferences(req, res));

export default router;
