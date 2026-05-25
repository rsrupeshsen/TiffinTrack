const router = require("express").Router();
const db = require("../db");

// GET /api/providers — browse with filters
router.get("/", async (req, res) => {
  const { diet, locality, max_price, cuisine } = req.query;
  try {
    let query = `
      SELECT 
        p.id,
        p.user_id,
        p.kitchen_name,
        p.bio,
        p.locality,
        p.city,
        p.cuisine_type,
        p.diet_type,
        p.price_per_day,
        p.capacity,
        p.upi_id,
        p.phone,
        p.whatsapp,
        p.photo_url,
        p.delivery_time,
        p.verified,
        p.accept_new,
        u.name AS owner_name,
        COALESCE(AVG(r.rating), 0)::numeric(3,1) AS avg_rating,
        COUNT(DISTINCT r.id)::int AS review_count
      FROM providers p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN reviews r ON r.provider_id = p.id
      WHERE p.verified = true
    `;
    const params = [];
    let idx = 1;

    if (diet) {
      query += ` AND p.diet_type = $${idx++}`;
      params.push(diet);
    }
    if (locality) {
      query += ` AND LOWER(p.locality) LIKE $${idx++}`;
      params.push(`%${locality.toLowerCase()}%`);
    }
    if (max_price) {
      query += ` AND p.price_per_day <= $${idx++}`;
      params.push(Number(max_price));
    }
    if (cuisine) {
      query += ` AND LOWER(p.cuisine_type) LIKE $${idx++}`;
      params.push(`%${cuisine.toLowerCase()}%`);
    }

    query += ` 
      GROUP BY p.id, u.name 
      ORDER BY avg_rating DESC, p.created_at DESC
    `;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching providers:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/providers/:id — full provider detail
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [providerRes, plansRes, menuRes, reviewsRes] = await Promise.all([
      db.query(
        `SELECT p.*, u.name AS owner_name,
          COALESCE(AVG(r.rating), 0)::numeric(3,1) AS avg_rating,
          COUNT(DISTINCT r.id)::int AS review_count
         FROM providers p
         JOIN users u ON u.id = p.user_id
         LEFT JOIN reviews r ON r.provider_id = p.id
         WHERE p.id = $1 
         GROUP BY p.id, u.name`,
        [id],
      ),
      db.query(
        "SELECT * FROM plans WHERE provider_id = $1 AND active = true ORDER BY price ASC",
        [id],
      ),
      db.query(
        `SELECT * FROM menus 
         WHERE provider_id = $1 
         AND week_start_date >= CURRENT_DATE - INTERVAL '7 days'
         ORDER BY day_of_week ASC 
         LIMIT 7`,
        [id],
      ),
      db.query(
        `SELECT r.*, 
          COALESCE(u.name, 'Anonymous') AS customer_name
         FROM reviews r 
         LEFT JOIN users u ON u.id = r.customer_id
         WHERE r.provider_id = $1 
         ORDER BY r.created_at DESC 
         LIMIT 20`,
        [id],
      ),
    ]);

    if (!providerRes.rows[0]) {
      return res.status(404).json({ error: "Provider not found" });
    }

    res.json({
      provider: providerRes.rows[0],
      plans: plansRes.rows,
      menu: menuRes.rows,
      reviews: reviewsRes.rows,
    });
  } catch (err) {
    console.error("Error fetching provider details:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
