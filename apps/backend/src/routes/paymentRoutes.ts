import { Router } from "express";
import { PaymentController } from "../controllers/PaymentController";
import { authMiddleware } from "../middleware/authMiddleware";
import { upload, setUploadKind } from "../middleware/uploadMiddleware";
import { uploadRateLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();
const controller = new PaymentController();

router.post(
  "/proof",
  authMiddleware,
  uploadRateLimiter,
  setUploadKind("proof"),
  upload.single("proof"),
  (req, res) => controller.uploadProof(req, res)
);
router.get("/my", authMiddleware, (req, res) => controller.myPayments(req, res));
router.get("/:id/proof", authMiddleware, (req, res) => controller.proof(req, res));

export default router;
