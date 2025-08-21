import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import { createDoubt, myDoubts, answerDoubt } from "../controllers/doubtController.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

router.post("/", authenticateToken, createDoubt);
router.get("/my", authenticateToken, myDoubts);
router.post("/:id/answer", authenticateToken, authorizeRoles(ROLES.EDUCATOR), answerDoubt);

export default router;
