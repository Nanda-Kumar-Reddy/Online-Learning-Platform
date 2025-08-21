import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { askQuestion, join, schedule } from "../controllers/liveClassController.js";

const router = Router();

router.get("/schedule", schedule);
router.post("/:id/join", authenticateToken, join);
router.post("/:id/questions", authenticateToken, askQuestion);

export default router;
