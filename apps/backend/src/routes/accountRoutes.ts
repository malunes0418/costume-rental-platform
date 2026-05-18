import { Router } from "express";
import { FulfillmentController } from "../controllers/FulfillmentController";

const router = Router();
const controller = new FulfillmentController();

router.get("/locations", (req, res) => controller.listSavedLocations(req, res));
router.post("/locations", (req, res) => controller.createSavedLocation(req, res));
router.put("/locations/:id", (req, res) => controller.updateSavedLocation(req, res));
router.delete("/locations/:id", (req, res) => controller.deleteSavedLocation(req, res));

export default router;
