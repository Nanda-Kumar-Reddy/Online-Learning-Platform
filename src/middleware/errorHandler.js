import { JSON_ERR } from "../utils/constants.js";

export function notFound(req, res) {
  return res.status(404).json(JSON_ERR("Resource not found", "NOT_FOUND"));
}

export function errorHandler(err, req, res, next) { 
  const status = err.status || 500;
  const code = err.code || "SERVER_ERROR";
  const message = err.message || "Internal Server Error";
  return res.status(status).json(JSON_ERR(message, code));
}
