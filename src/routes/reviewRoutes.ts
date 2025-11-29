import { Router } from "express";
import { ReviewController } from "../controllers/ReviewController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
const controller = new ReviewController();

router.post("/", authMiddleware, (req, res) => controller.createOrUpdate(req, res));
router.get("/costumes/:costumeId", (req, res) => controller.listCostumeReviews(req, res));
router.delete("/:id", authMiddleware, (req, res) => controller.delete(req, res));

export default router;
