import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getLesson, saveNote, updateProgress } from "../controllers/lessonController.js";

const router = Router();

router.get("/:id", authenticateToken, getLesson);
router.post("/:id/progress", authenticateToken, updateProgress);
router.post("/:id/notes", authenticateToken, saveNote);

export default router;
