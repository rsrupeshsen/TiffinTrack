const router = require("express").Router();
const db = require("../db");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const EXTRACTION_PROMPT = `You extract search constraints from a food query.
Return ONLY valid JSON. No explanation, no markdown, no code blocks.
Fields: { "diet": null|"veg"|"nonveg", "cuisine": null|string, "max_price": null|number,
          "locality": null|string, "delivery_before": null|"HH:MM",
          "restrictions": null|[string], "meal_type": null|"lunch"|"dinner"|"both" }
Use null for any field not mentioned.`;

router.post("/", async (req, res) => {
  const { message, sessionId } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });

  try {
    // 1. Get session context (previous intent)
    let previousIntent = {};
    if (sessionId) {
      const session = await db.query(
        "SELECT last_intent FROM chat_sessions WHERE id = $1",
        [sessionId],
      );
      if (session.rows[0]?.last_intent)
        previousIntent = session.rows[0].last_intent;
    }

    // 2. Extract constraints via Groq
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        { role: "user", content: message },
      ],
      max_tokens: 300,
      temperature: 0,
    });

    let extracted = {};
    try {
      extracted = JSON.parse(completion.choices[0].message.content);
    } catch {
      extracted = {};
    }

    // Merge with previous intent (for follow-up messages like "show me cheaper ones")
    const intent = {
      ...previousIntent,
      ...Object.fromEntries(
        Object.entries(extracted).filter(([, v]) => v !== null),
      ),
    };

    // 3. Build SQL query from intent
    let query = `
      SELECT p.id, p.kitchen_name, p.locality, p.cuisine_type, p.diet_type,
             p.price_per_day, p.photo_url, p.upi_id,
             u.phone AS owner_phone,
             COALESCE(AVG(r.rating), 0)::numeric(3,1) AS avg_rating
      FROM providers p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN reviews r ON r.provider_id = p.id
      WHERE p.verified = true AND p.accept_new = true
    `;
    const params = [];
    let idx = 1;

    if (intent.diet) {
      query += ` AND p.diet_type = $${idx++}`;
      params.push(intent.diet);
    }
    if (intent.locality) {
      query += ` AND LOWER(p.locality) LIKE $${idx++}`;
      params.push(`%${intent.locality.toLowerCase()}%`);
    }
    if (intent.max_price) {
      query += ` AND p.price_per_day <= $${idx++}`;
      params.push(intent.max_price);
    }
    if (intent.cuisine) {
      query += ` AND LOWER(p.cuisine_type) LIKE $${idx++}`;
      params.push(`%${intent.cuisine.toLowerCase()}%`);
    }

    query += ` GROUP BY p.id, u.phone ORDER BY avg_rating DESC LIMIT 5`;

    const results = await db.query(query, params);

    // 4. Save session
    if (sessionId) {
      await db.query(
        `INSERT INTO chat_sessions (id, last_intent, messages)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET last_intent = $2, updated_at = NOW()`,
        [sessionId, JSON.stringify(intent), JSON.stringify([])],
      );
    }

    // 5. Generate natural response text
    const count = results.rows.length;
    let responseText =
      count > 0
        ? `I found ${count} tiffin provider${count > 1 ? "s" : ""} matching your request:`
        : "I couldn't find any providers matching that exactly. Try broadening your search — remove one of the filters.";

    res.json({ text: responseText, results: results.rows, intent });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
