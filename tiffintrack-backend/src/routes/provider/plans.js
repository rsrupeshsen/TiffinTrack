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

// GET /api/provider/plans
router.get("/plans", auth, requireProvider, async (req, res) => {
  try {
    const providerId = await getProviderId(req.user.userId);
    if (!providerId)
      return res.status(404).json({ error: "Kitchen profile not found" });

    const result = await db.query(
      `SELECT * FROM plans WHERE provider_id = $1 ORDER BY created_at DESC`,
      [providerId],
    );
    res.json({ plans: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/provider/plans
router.post("/plans", auth, requireProvider, async (req, res) => {
  const { name, days, price, description } = req.body;
  if (!name || !days || !price) {
    return res.status(400).json({ error: "name, days and price are required" });
  }
  try {
    const providerId = await getProviderId(req.user.userId);
    if (!providerId)
      return res.status(404).json({ error: "Kitchen profile not found" });

    const result = await db.query(
      `INSERT INTO plans (provider_id, name, days, price, description, active)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
      [providerId, name, days, price, description],
    );
    res.status(201).json({ plan: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/provider/plans/:id
router.put("/plans/:id", auth, requireProvider, async (req, res) => {
  const { name, days, price, description, active } = req.body;
  try {
    const providerId = await getProviderId(req.user.userId);
    if (!providerId)
      return res.status(404).json({ error: "Kitchen profile not found" });

    const result = await db.query(
      `UPDATE plans SET
         name        = COALESCE($1, name),
         days        = COALESCE($2, days),
         price       = COALESCE($3, price),
         description = COALESCE($4, description),
         active      = COALESCE($5, active)
       WHERE id = $6 AND provider_id = $7
       RETURNING *`,
      [name, days, price, description, active, req.params.id, providerId],
    );
    if (!result.rows[0])
      return res.status(404).json({ error: "Plan not found" });
    res.json({ plan: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/provider/plans/:id
// Soft delete (active = false) so existing subscribers on this plan
// keep it until their cycle ends — new subscribers just can't pick it.
router.delete("/plans/:id", auth, requireProvider, async (req, res) => {
  try {
    const providerId = await getProviderId(req.user.userId);
    if (!providerId)
      return res.status(404).json({ error: "Kitchen profile not found" });

    const result = await db.query(
      `UPDATE plans SET active = false WHERE id = $1 AND provider_id = $2 RETURNING *`,
      [req.params.id, providerId],
    );
    if (!result.rows[0])
      return res.status(404).json({ error: "Plan not found" });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
