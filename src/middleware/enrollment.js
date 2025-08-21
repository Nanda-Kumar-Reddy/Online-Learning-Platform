import { getDb } from "../config/database.js";
import { JSON_ERR } from "../utils/constants.js";

export function requireEnrollment() {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const courseId = parseInt(req.params.courseId || req.params.id, 10);
      if (!userId || !courseId) return res.status(400).json(JSON_ERR("Missing courseId", "ENR_400"));

      const db = await getDb();
      const enrollment = await db.get(
        `SELECT e.*, CASE WHEN date(e.expiry_date) >= date('now') THEN 1 ELSE 0 END AS active
         FROM enrollments e WHERE e.user_id = ? AND e.course_id = ?`,
        [userId, courseId]
      );
      if (!enrollment) return res.status(403).json(JSON_ERR("Not enrolled", "ENR_403"));
      if (!enrollment.active) return res.status(403).json(JSON_ERR("Enrollment expired", "ENR_410"));

      req.enrollment = enrollment;
      next();
    } catch (e) {
      return res.status(500).json(JSON_ERR("Enrollment check failed", "ENR_500"));
    }
  };
}
