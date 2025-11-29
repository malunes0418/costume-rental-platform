import { Router } from "express";
import { CostumeController } from "../controllers/CostumeController";

const router = Router();
const controller = new CostumeController();

router.get("/", (req, res) => controller.list(req, res));
router.get("/:id", (req, res) => controller.getById(req, res));
router.get("/:id/availability", (req, res) => controller.availability(req, res));

export default router;
