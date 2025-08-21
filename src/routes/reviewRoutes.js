import express from "express";
import { addReview } from "../controllers/reviewController.js";
import { authenticateToken } from "../middleware/auth.js";

const reviewRouter = express.Router();

reviewRouter.post("/courses/:id/review", authenticateToken, addReview);

export default reviewRouter;
