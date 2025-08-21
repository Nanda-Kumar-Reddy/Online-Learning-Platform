import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { listTests, startTest, submitTest } from "../controllers/testController.js";

const router = Router();

router.get("/", listTests);
router.post("/:id/start", authenticateToken, startTest);
router.post("/:sessionId/submit", authenticateToken, submitTest);

export default router;
