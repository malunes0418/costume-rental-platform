import { Router } from "express";
import { ReviewController } from "../controllers/ReviewController";
import { authMiddleware } from "../middleware/authMiddleware";
import { apiLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();
const controller = new ReviewController();

router.post("/", apiLimiter, authMiddleware, (req, res) => controller.createOrUpdate(req, res));
router.get("/costumes/:costumeId", apiLimiter, (req, res) => controller.listCostumeReviews(req, res));
router.delete("/:id", apiLimiter, authMiddleware, (req, res) => controller.delete(req, res));

export default router;
