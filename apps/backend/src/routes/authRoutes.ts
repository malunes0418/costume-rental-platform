import { Router } from "express";
import passport from "../config/oauth";
import { AuthController } from "../controllers/AuthController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
const controller = new AuthController();

router.post("/register", (req, res) => controller.register(req, res));
router.post("/login", (req, res) => controller.login(req, res));
router.post("/logout", (req, res) => controller.logout(req, res));
router.get("/me", authMiddleware, (req, res) => controller.me(req, res));

router.get("/google", (req, res, next) => {
  const intent = controller.getOAuthIntent(req);
  passport.authenticate("google", { scope: ["profile", "email"], state: intent })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (error: unknown, user: Express.User | false) => {
    if (error || !user) {
      controller.oauthFailure(req, res, error ?? new Error("Google authentication failed"));
      return;
    }

    (req as any).user = user;
    controller.oauthCallback(req, res);
  })(req, res, next);
});

export default router;
