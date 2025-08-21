import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { enrollCourse, getCourseDetails, listCourses } from "../controllers/courseController.js";

const router = Router();

router.get("/", listCourses);
router.get("/:id", getCourseDetails);
router.post("/:id/enroll", authenticateToken, enrollCourse);

export default router;
