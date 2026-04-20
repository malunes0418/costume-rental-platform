import { Router } from "express";
import { WishlistController } from "../controllers/WishlistController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
const controller = new WishlistController();

router.post("/", authMiddleware, (req, res) => controller.add(req, res));
router.delete("/:costumeId", authMiddleware, (req, res) => controller.remove(req, res));
router.get("/", authMiddleware, (req, res) => controller.list(req, res));

export default router;
