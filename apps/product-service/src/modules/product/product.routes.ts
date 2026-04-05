import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "product service working" });
});

export default router;