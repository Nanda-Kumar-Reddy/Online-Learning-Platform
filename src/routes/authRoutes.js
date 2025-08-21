import { Router } from "express";
import { body } from "express-validator";
import { handleValidation } from "../middleware/validation.js";
import { registerLearner, registerEducator, login } from "../controllers/authController.js";

const router = Router();

router.post("/register",
  body("name").isString().isLength({ min: 2 }),
  body("email").isEmail(),
  body("password").isLength({ min: 8 }),
  body("mobile").isString().isLength({ min: 7 }),
  handleValidation,
  registerLearner
);

router.post("/educator/register",
  body("name").isString().isLength({ min: 2 }),
  body("email").isEmail(),
  body("password").isLength({ min: 8 }),
  body("mobile").isString().isLength({ min: 7 }),
  body("experience").optional().isInt({ min: 0 }),
  handleValidation,
  registerEducator
);

router.post("/login",
  body("email").isEmail(),
  body("password").isString(),
  body("role").optional().isIn(["learner", "educator"]),
  handleValidation,
  login
);

export default router;
