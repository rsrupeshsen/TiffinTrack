const router = require("express").Router();
const db = require("../db");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const EXTRACTION_PROMPT = `You extract search constraints from a food query.
Return ONLY valid JSON. No explanation, no markdown, no code blocks.
Fields: { "diet": null|"veg"|"non-veg", "cuisine": null|string, "max_price": null|number,
          "locality": null|string, "delivery_before": null|"HH:MM",
          "restrictions": null|[string], "meal_type": null|"lunch"|"dinner"|"both" }
Use null for any field not mentioned.`;

router.post("/", async (req, res) => {
  const { message, sessionId } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });

  try {
    // 1. Load previous session intent (if any)
    let previousIntent = {};
    if (sessionId) {
      const sessionSql =
        "SELECT last_intent FROM chat_sessions WHERE session_id = $1";
      const session = await db.query(sessionSql, [sessionId]);
      if (session.rows[0]?.last_intent) {
        previousIntent = session.rows[0].last_intent;
      }
    }

    // 2. Call Groq to extract structured filters
    let extracted = {};
    try {
      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: EXTRACTION_PROMPT },
          { role: "user", content: message },
        ],
        max_tokens: 300,
        temperature: 0,
      });
      const raw = completion.choices?.[0]?.message?.content || "{}";
      const cleaned = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      extracted = JSON.parse(cleaned);
    } catch (groqErr) {
      console.error(
        "Groq extraction failed, continuing with empty filters:",
        groqErr.message,
      );
      extracted = {};
    }

 const newFields = Object.fromEntries(
   Object.entries(extracted).filter(([, v]) => v !== null),
 );

 // If this message specified 2+ new constraints, treat it as a fresh
 // search and discard old filters. Only inherit old context when the
 // message is a light follow-up (0-1 new fields, e.g. "cheaper please").
 const intent =
   Object.keys(newFields).length >= 2
     ? newFields
     : { ...previousIntent, ...newFields };
    // 3. Build the provider search query
    const params = [];
    let idx = 1;
    let sql =
      "SELECT p.id, p.kitchen_name, p.locality, p.cuisine_type, p.diet_type, " +
      "p.price_per_day, p.photo_url, p.upi_id, u.phone AS phone, " +
      "COALESCE(AVG(r.rating), 0)::numeric(3,1) AS avg_rating " +
      "FROM providers p " +
      "JOIN users u ON u.id = p.user_id " +
      "LEFT JOIN reviews r ON r.provider_id = p.id " +
      "WHERE p.verified = true AND p.accept_new = true";

    if (intent.diet) {
      sql += ` AND LOWER(p.diet_type) = LOWER($${idx++})`;
      params.push(intent.diet);
    }
    if (intent.locality) {
      sql += ` AND LOWER(p.locality) LIKE $${idx++}`;
      params.push(`%${intent.locality.toLowerCase()}%`);
    }
    if (intent.max_price) {
      sql += ` AND p.price_per_day <= $${idx++}`;
      params.push(Number(intent.max_price));
    }
    if (intent.cuisine) {
      sql += ` AND LOWER(p.cuisine_type) LIKE $${idx++}`;
      params.push(`%${intent.cuisine.toLowerCase()}%`);
    }

    sql += " GROUP BY p.id, u.phone ORDER BY avg_rating DESC LIMIT 5";

    const results = await db.query(sql, params);

    // 4. Save session
    if (sessionId) {
      const upsertSql =
        "INSERT INTO chat_sessions (session_id, last_intent, messages) " +
        "VALUES ($1, $2, $3) " +
        "ON CONFLICT (session_id) DO UPDATE SET last_intent = $2, updated_at = NOW()";
      await db.query(upsertSql, [
        sessionId,
        JSON.stringify(intent),
        JSON.stringify([]),
      ]);
    }

    const count = results.rows.length;
    const responseText =
      count > 0
        ? `I found ${count} tiffin provider${count > 1 ? "s" : ""} matching your request:`
        : "I couldn't find any providers matching that exactly. Try broadening your search — remove one of the filters.";

    res.json({ message: responseText, providers: results.rows, intent });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
