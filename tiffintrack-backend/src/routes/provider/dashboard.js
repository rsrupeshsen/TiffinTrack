const router = require("express").Router();
const db = require("../db");
const auth = require("../../middleware/auth");

// GET /api/provider/dashboard
router.get("/dashboard", auth, async (req, res) => {
  try {
    const provRes = await db.query(
      "SELECT id, capacity FROM providers WHERE user_id = $1",
      [req.user.userId],
    );
    if (!provRes.rows[0])
      return res.status(404).json({ error: "Provider profile not found" });
    const providerId = provRes.rows[0].id;
    const capacity = provRes.rows[0].capacity;

    const today = new Date().toISOString().split("T")[0];
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    )
      .toISOString()
      .split("T")[0];

    const [activeRes, paidRes, unpaidRes, deliveryListRes, chartRes] =
      await Promise.all([
        // Active subscriber count
        db.query(
          `SELECT COUNT(*) FROM subscriptions WHERE provider_id = $1 AND status = 'active'`,
          [providerId],
        ),
        // Paid this month
        db.query(
          `SELECT COALESCE(SUM(pl.price), 0) AS revenue
         FROM payments pay
         JOIN subscriptions s ON s.id = pay.subscription_id
         JOIN plans pl ON pl.id = s.plan_id
         WHERE s.provider_id = $1 AND pay.marked_paid = true AND pay.month_year = to_char(NOW(), 'YYYY-MM')`,
          [providerId],
        ),
        // Unpaid count
        db.query(
          `SELECT COUNT(*) FROM subscriptions s
         LEFT JOIN payments pay ON pay.subscription_id = s.id AND pay.month_year = to_char(NOW(), 'YYYY-MM')
         WHERE s.provider_id = $1 AND s.status = 'active' AND (pay.marked_paid IS NULL OR pay.marked_paid = false)`,
          [providerId],
        ),
        // Today's delivery list (active, not paused today)
        db.query(
          `SELECT s.id, u.name AS customer_name, u.phone AS customer_phone,
                pl.name AS plan_name, s.meal_type,
                COALESCE(pay.marked_paid, false) AS paid
         FROM subscriptions s
         JOIN users u ON u.id = s.customer_id
         JOIN plans pl ON pl.id = s.plan_id
         LEFT JOIN payments pay ON pay.subscription_id = s.id AND pay.month_year = to_char(NOW(), 'YYYY-MM')
         WHERE s.provider_id = $1 AND s.status = 'active'
           AND s.id NOT IN (SELECT subscription_id FROM pauses WHERE pause_date = $2)
         ORDER BY u.name`,
          [providerId, today],
        ),
        // Last 7 days delivery counts for bar chart
        db.query(
          `SELECT DATE(d.date) AS day, COUNT(*) AS count
         FROM deliveries d
         JOIN subscriptions s ON s.id = d.subscription_id
         WHERE s.provider_id = $1 AND d.date >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(d.date) ORDER BY day`,
          [providerId],
        ),
      ]);

    res.json({
      stats: {
        active_subscribers: Number(activeRes.rows[0].count),
        revenue_this_month: Number(paidRes.rows[0].revenue),
        unpaid_count: Number(unpaidRes.rows[0].count),
        spots_remaining: capacity - Number(activeRes.rows[0].count),
      },
      delivery_list: deliveryListRes.rows,
      chart_data: chartRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
