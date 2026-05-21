const router = require("express").Router();
const db = require("../../db");
const auth = require("../../middleware/auth");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function getProviderId(userId) {
  const res = await db.query("SELECT id FROM providers WHERE user_id = $1", [
    userId,
  ]);
  return res.rows[0]?.id;
}

// GET /api/provider/menu
router.get("/menu", auth, async (req, res) => {
  const providerId = await getProviderId(req.user.userId);
  if (!providerId) return res.status(404).json({ error: "Provider not found" });
  try {
    // Get current week's menu
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const result = await db.query(
      `SELECT * FROM menus WHERE provider_id = $1 AND week_start_date = $2 ORDER BY day_of_week`,
      [providerId, weekStartStr],
    );
    res.json({ menu: result.rows, week_start: weekStartStr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/provider/menu — upsert entire week
router.put("/menu", auth, async (req, res) => {
  const { menu, week_start_date } = req.body; // menu = array of { day_of_week, main_item, side_items, extras }
  const providerId = await getProviderId(req.user.userId);
  if (!providerId) return res.status(404).json({ error: "Provider not found" });

  try {
    for (const day of menu) {
      await db.query(
        `INSERT INTO menus (provider_id, day_of_week, main_item, side_items, extras, week_start_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (provider_id, day_of_week, week_start_date)
         DO UPDATE SET main_item = $3, side_items = $4, extras = $5`,
        [
          providerId,
          day.day_of_week,
          day.main_item,
          day.side_items,
          day.extras,
          week_start_date,
        ],
      );
    }
    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/provider/menu/translate — translate menu to Kannada via Groq
router.post("/menu/translate", auth, async (req, res) => {
  const { menu } = req.body;
  try {
    const menuText = menu
      .map(
        (d) =>
          `Day ${d.day_of_week}: ${d.main_item}, ${d.side_items}, ${d.extras}`,
      )
      .join("\n");
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content:
            "Translate the food menu to Kannada. Return ONLY the translated text, same format, one line per day.",
        },
        { role: "user", content: menuText },
      ],
      max_tokens: 500,
    });
    res.json({ translated: completion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
