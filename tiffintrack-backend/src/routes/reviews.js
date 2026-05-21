const router = require("express").Router();
const db = require("../db");
const axios = require("axios");

async function getSentiment(text) {
  try {
    const res = await axios.post(
      "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english",
      { inputs: text },
      {
        headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
        timeout: 5000,
      },
    );
    const label = res.data[0]?.[0]?.label?.toLowerCase() || "positive";
    const score = res.data[0]?.[0]?.score || 0.9;
    return { label, score };
  } catch {
    return { label: "positive", score: 0.9 }; // fallback if HF is slow
  }
}

// POST /api/reviews
router.post("/", async (req, res) => {
  const { provider_id, rating, text, customer_name } = req.body;
  if (!provider_id || !rating)
    return res.status(400).json({ error: "provider_id and rating required" });

  // Get or create anonymous user for guest reviews
  let customer_id = null;
  if (customer_name) {
    try {
      const existing = await db.query(
        "SELECT id FROM users WHERE name = $1 AND role = $2",
        [customer_name, "guest"],
      );
      if (existing.rows[0]) {
        customer_id = existing.rows[0].id;
      } else {
        const newUser = await db.query(
          `INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, 'guest', 'n/a') RETURNING id`,
          [customer_name, `guest_${Date.now()}@tiffintrack.in`],
        );
        customer_id = newUser.rows[0].id;
      }
    } catch {
      /* ignore */
    }
  }

  try {
    let sentiment = "positive",
      confidence = 0.9;
    if (text) {
      const s = await getSentiment(text);
      sentiment = s.label;
      confidence = s.score;
    }

    const result = await db.query(
      `INSERT INTO reviews (customer_id, provider_id, rating, text, sentiment, confidence)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [customer_id, provider_id, rating, text, sentiment, confidence],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
