import { validationResult } from "express-validator";
import { JSON_ERR } from "../utils/constants.js";

export function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(JSON_ERR("Invalid input", "VAL_400", errors.array()));
  }
  next();
}
