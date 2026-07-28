const router = require("express").Router();
const db = require("../../db");
const auth = require("../../middleware/auth");

function requireProvider(req, res, next) {
  if (req.user.role !== "provider") {
    return res.status(403).json({ error: "Provider access only" });
  }
  next();
}

async function getProviderId(userId) {
  const r = await db.query("SELECT id FROM providers WHERE user_id = $1", [
    userId,
  ]);
  return r.rows[0]?.id;
}

// GET /api/provider/subscribers
// Every subscription for this provider, with pause info computed live
// from the pauses table — no separate "paused" status to keep in sync.
router.get("/subscribers", auth, requireProvider, async (req, res) => {
  try {
    const providerId = await getProviderId(req.user.userId);
    if (!providerId)
      return res.status(404).json({ error: "Kitchen profile not found" });

    const result = await db.query(
      `SELECT
         s.id, s.status, s.start_date, s.meal_type,
         u.name  AS customer_name,
         u.phone AS customer_phone,
         p.name  AS plan_name,
         p.days  AS plan_days,
         p.price AS plan_price,
         EXISTS (
           SELECT 1 FROM pauses ps
           WHERE ps.subscription_id = s.id AND ps.pause_date = CURRENT_DATE
         ) AS is_paused_today,
         COALESCE(
           (SELECT array_agg(ps.pause_date ORDER BY ps.pause_date)
            FROM pauses ps
            WHERE ps.subscription_id = s.id AND ps.pause_date >= CURRENT_DATE),
           '{}'
         ) AS upcoming_pauses
       FROM subscriptions s
       JOIN users u ON u.id = s.customer_id
       JOIN plans p ON p.id = s.plan_id
       WHERE s.provider_id = $1
       ORDER BY
         CASE s.status WHEN 'active' THEN 0 WHEN 'paused' THEN 1 ELSE 2 END,
         s.start_date DESC`,
      [providerId],
    );
    res.json({ subscribers: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/provider/deliveries/today
// Active subscriptions minus anyone paused today. This count is exactly
// how many tiffins to cook — matches the PRD's "delivery list" behaviour.
router.get("/deliveries/today", auth, requireProvider, async (req, res) => {
  try {
    const providerId = await getProviderId(req.user.userId);
    if (!providerId)
      return res.status(404).json({ error: "Kitchen profile not found" });

    const result = await db.query(
      `SELECT s.id, u.name AS customer_name, u.phone AS customer_phone, p.name AS plan_name
       FROM subscriptions s
       JOIN users u ON u.id = s.customer_id
       JOIN plans p ON p.id = s.plan_id
       WHERE s.provider_id = $1
         AND s.status = 'active'
         AND NOT EXISTS (
           SELECT 1 FROM pauses ps
           WHERE ps.subscription_id = s.id AND ps.pause_date = CURRENT_DATE
         )
       ORDER BY u.name`,
      [providerId],
    );
    res.json({ deliveries: result.rows, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
