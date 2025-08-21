import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { courseProgress, dashboard } from "../controllers/progressController.js";

const router = Router();

router.get("/dashboard", authenticateToken, dashboard);
router.get("/course/:courseId", authenticateToken, courseProgress);

export default router;
