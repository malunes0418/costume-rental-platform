import { Router } from "express";
import { WishlistController } from "../controllers/WishlistController";
import { authMiddleware } from "../middleware/authMiddleware";
import { apiLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();
const controller = new WishlistController();

router.post("/", apiLimiter, authMiddleware, (req, res) => controller.add(req, res));
router.delete("/:costumeId", apiLimiter, authMiddleware, (req, res) => controller.remove(req, res));
router.get("/", apiLimiter, authMiddleware, (req, res) => controller.list(req, res));

export default router;
