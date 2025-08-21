import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { JSON_ERR } from "../utils/constants.js";
dotenv.config();

export function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;

    if (!token) return res.status(401).json(JSON_ERR("Invalid JWT Token", "AUTH_001"));

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
      if (err) return res.status(401).json(JSON_ERR("Invalid JWT Token", "AUTH_002"));
      req.user = { id: payload.id, role: payload.role, name: payload.name };
      next();
    });
  } catch (e) {
    return res.status(500).json(JSON_ERR("Authentication error", "AUTH_500"));
  }
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json(JSON_ERR("Unauthorized", "AUTH_003"));
    if (!roles.includes(req.user.role)) return res.status(403).json(JSON_ERR("Forbidden", "AUTH_004"));
    return next();
  };
}
