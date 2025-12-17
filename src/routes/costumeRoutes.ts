import { Router } from "express";
import { CostumeController } from "../controllers/CostumeController";
import { apiLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();
const controller = new CostumeController();

router.get("/", apiLimiter, (req, res) => controller.list(req, res));
router.get("/:id", apiLimiter, (req, res) => controller.getById(req, res));
router.get("/:id/availability", apiLimiter, (req, res) => controller.availability(req, res));

export default router;
