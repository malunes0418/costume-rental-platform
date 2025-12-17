import { Router } from "express";
import { PaymentController } from "../controllers/PaymentController";
import { authMiddleware } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import { apiLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();
const controller = new PaymentController();

router.post("/proof", apiLimiter, authMiddleware, upload.single("proof"), (req, res) => controller.uploadProof(req, res));
router.get("/my", apiLimiter, authMiddleware, (req, res) => controller.myPayments(req, res));

export default router;
