import { Router } from "express";
import passport from "../config/oauth";
import { AuthController } from "../controllers/AuthController";
import { authMiddleware } from "../middleware/authMiddleware";
import { authLimiter, apiLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();
const controller = new AuthController();

router.post("/register", authLimiter, (req, res) => controller.register(req, res));
router.post("/login", authLimiter, (req, res) => controller.login(req, res));
router.get("/me", apiLimiter, authMiddleware, (req, res) => controller.me(req, res));

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res) => controller.oauthCallback(req, res)
);

export default router;
