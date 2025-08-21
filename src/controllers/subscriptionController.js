import { getDb } from "../config/database.js";
import { JSON_ERR, JSON_OK } from "../utils/constants.js";

export const plans = async (_req, res) => {
  try {
    const db = await getDb();
    const plans = await db.all(`SELECT * FROM subscriptions ORDER BY price_cents ASC`);
    return res.json(JSON_OK({
      plans: plans.map(p => ({
        id: p.id, name: p.name, price: Math.round(p.price_cents / 100), duration: p.duration, features: JSON.parse(p.features_json)
      }))
    }));
  } catch {
    return res.status(500).json(JSON_ERR("Failed to fetch plans", "SUB_500"));
  }
};

export const purchase = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;
    const db = await getDb();

    const plan = await db.get(`SELECT * FROM subscriptions WHERE id = ?`, [planId]);
    if (!plan) return res.status(404).json(JSON_ERR("Plan not found", "SUB_404"));

    const validUntilExpr = plan.duration === "monthly" ? "+30 days" : plan.duration === "yearly" ? "+365 days" : "+30 days";

    await db.run(
      `INSERT INTO user_subscriptions (user_id, subscription_id, purchased_at, valid_until, status, amount_cents)
       VALUES (?, ?, datetime('now'), datetime('now', ?), 'active', ?)`,
      [userId, planId, validUntilExpr, plan.price_cents]
    );

    return res.status(201).json(JSON_OK({ message: "Subscription purchased" }));
  } catch {
    return res.status(500).json(JSON_ERR("Failed to purchase", "SUB_500"));
  }
};
