import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { plans, purchase } from "../controllers/subscriptionController.js";

const router = Router();

router.get("/plans", plans);
router.post("/purchase", authenticateToken, purchase);

export default router;
