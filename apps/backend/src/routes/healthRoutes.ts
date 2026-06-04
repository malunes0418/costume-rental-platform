import { Router } from "express";

const router = Router();

router.head("/", (_req, res) => {
  res.sendStatus(204);
});

export default router;
