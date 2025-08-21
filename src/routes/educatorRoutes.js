import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { followEducator, getEducator, listEducators } from "../controllers/educatorController.js";

const router = Router();

router.get("/", listEducators);
router.get("/:id", getEducator);
router.post("/:id/follow", authenticateToken, followEducator);

export default router;
