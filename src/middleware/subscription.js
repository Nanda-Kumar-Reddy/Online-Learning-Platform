import { getDb } from "../config/database.js";
import { JSON_ERR } from "../utils/constants.js";

export function requireActiveSubscription() {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const db = await getDb();
      const active = await db.get(
        `SELECT 1 FROM user_subscriptions us 
         WHERE us.user_id = ? AND datetime(us.valid_until) >= datetime('now') 
         LIMIT 1`,
        [userId]
      );
      if (!active) return res.status(403).json(JSON_ERR("Active subscription required", "SUB_403"));
      next();
    } catch (e) {
      return res.status(500).json(JSON_ERR("Subscription check failed", "SUB_500"));
    }
  };
}
