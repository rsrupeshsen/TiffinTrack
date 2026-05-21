const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");

// GET /api/subscriptions/me
router.get("/me", auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*, p.kitchen_name, p.locality, p.upi_id, p.photo_url,
              pl.name AS plan_name, pl.days AS plan_days, pl.price AS plan_price,
              u.name AS provider_owner_name
       FROM subscriptions s
       JOIN providers p ON p.id = s.provider_id
       JOIN plans pl ON pl.id = s.plan_id
       JOIN users u ON u.id = p.user_id
       WHERE s.customer_id = $1 AND s.status IN ('active','pending')
       ORDER BY s.created_at DESC`,
      [req.user.userId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subscriptions — subscribe to a plan
router.post("/", auth, async (req, res) => {
  const { provider_id, plan_id, meal_type = "lunch" } = req.body;
  if (!provider_id || !plan_id)
    return res.status(400).json({ error: "provider_id and plan_id required" });
  try {
    // Check capacity
    const cap = await db.query(
      `SELECT p.capacity,
        (SELECT COUNT(*) FROM subscriptions WHERE provider_id = p.id AND status = 'active') AS current
       FROM providers p WHERE p.id = $1`,
      [provider_id],
    );
    const { capacity, current } = cap.rows[0];
    if (Number(current) >= Number(capacity)) {
      return res.status(400).json({ error: "Provider is at full capacity" });
    }

    const result = await db.query(
      `INSERT INTO subscriptions (customer_id, provider_id, plan_id, meal_type, status, start_date)
       VALUES ($1, $2, $3, $4, 'pending', NOW()) RETURNING *`,
      [req.user.userId, provider_id, plan_id, meal_type],
    );

    // Get UPI ID so customer can pay
    const provRes = await db.query(
      "SELECT upi_id, kitchen_name FROM providers WHERE id = $1",
      [provider_id],
    );
    res.status(201).json({ subscription: result.rows[0], ...provRes.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subscriptions/:id/pause
router.post("/:id/pause", auth, async (req, res) => {
  const { dates } = req.body; // array of 'YYYY-MM-DD'
  if (!dates?.length)
    return res.status(400).json({ error: "dates array required" });
  try {
    const values = dates.map((d, i) => `($1, $${i + 2})`).join(", ");
    await db.query(
      `INSERT INTO pauses (subscription_id, pause_date) VALUES ${values} ON CONFLICT DO NOTHING`,
      [req.params.id, ...dates],
    );
    res.json({ paused: dates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subscriptions/:id/cancel
router.post("/:id/cancel", auth, async (req, res) => {
  try {
    await db.query(
      `UPDATE subscriptions SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND customer_id = $2`,
      [req.params.id, req.user.userId],
    );
    res.json({ cancelled: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
