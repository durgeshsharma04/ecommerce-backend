import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Order service working" });
});

export default router;