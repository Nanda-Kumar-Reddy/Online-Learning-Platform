import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { courseMaterials, trackDownload } from "../controllers/materialController.js";

const router = Router();

router.get("/course/:courseId", authenticateToken, courseMaterials);
router.post("/:id/download", authenticateToken, trackDownload);

export default router;
