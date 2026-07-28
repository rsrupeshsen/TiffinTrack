const router = require("express").Router();
const bcrypt = require("bcryptjs");
const db = require("../../db");
const auth = require("../../middleware/auth");
const { upload } = require("../../services/cloudinaryService");

// Small guard so a customer JWT can't hit provider-only routes
function requireProvider(req, res, next) {
  if (req.user.role !== "provider") {
    return res.status(403).json({ error: "Provider access only" });
  }
  next();
}

// POST /api/provider/setup
// Called once, right after a provider registers via /api/auth/register.
// Creates the providers row that every other provider route depends on.
router.post("/setup", auth, requireProvider, async (req, res) => {
  const {
    kitchen_name,
    locality,
    phone,
    city = "Udupi",
    cuisine_type,
    diet_type,
  } = req.body;

  if (!kitchen_name) {
    return res.status(400).json({ error: "kitchen_name is required" });
  }

  try {
    // Prevent creating a second kitchen for the same user
    const existing = await db.query(
      "SELECT id FROM providers WHERE user_id = $1",
      [req.user.userId],
    );
    if (existing.rows[0]) {
      return res.status(409).json({
        error: "Kitchen profile already exists",
        providerId: existing.rows[0].id,
      });
    }

const result = await db.query(
  `INSERT INTO providers
     (
       user_id,
       kitchen_name,
       locality,
       phone,
       city,
       cuisine_type,
       diet_type,
       price_per_day,
       capacity,
       verified,
       accept_new
     )
   VALUES
     ($1, $2, $3, $4, $5, $6, $7, 0, 20, false, true)
   RETURNING *`,
  [
    req.user.userId,
    kitchen_name,
    locality,
    phone,
    city,
    cuisine_type,
    diet_type,
  ],
);

    res.status(201).json({ provider: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/provider/profile — the logged-in provider's own kitchen profile
router.get("/profile", auth, requireProvider, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, u.name AS owner_name, u.email, u.phone AS owner_phone
       FROM providers p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1`,
      [req.user.userId],
    );
    if (!result.rows[0]) {
      // Signals the frontend to show the "set up your kitchen" screen
      return res
        .status(404)
        .json({ error: "No kitchen profile yet", needsSetup: true });
    }
    res.json({ provider: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/provider/profile — update kitchen profile fields
router.put("/profile", auth, requireProvider, async (req, res) => {
  const {
    kitchen_name,
    bio,
    locality,
    city,
    cuisine_type,
    diet_type,
    price_per_day,
    capacity,
    upi_id,
    photo_url,
    phone,
    whatsapp,
    delivery_time,
    languages,
    working_hours,
    accept_new,
    breakfast_available,
    lunch_available,
    dinner_available,
  } = req.body;

  try {
    const result = await db.query(
      `UPDATE providers SET
         kitchen_name   = COALESCE($1, kitchen_name),
         bio            = COALESCE($2, bio),
         locality       = COALESCE($3, locality),
         city           = COALESCE($4, city),
         cuisine_type   = COALESCE($5, cuisine_type),
         diet_type      = COALESCE($6, diet_type),
         price_per_day  = COALESCE($7, price_per_day),
         capacity       = COALESCE($8, capacity),
         upi_id         = COALESCE($9, upi_id),
         photo_url      = COALESCE($10, photo_url),
         phone          = COALESCE($11, phone),
         whatsapp       = COALESCE($12, whatsapp),
         delivery_time  = COALESCE($13, delivery_time),
         languages      = COALESCE($14, languages),
         working_hours  = COALESCE($15, working_hours),
         accept_new     = COALESCE($16, accept_new),
         breakfast_available = COALESCE($17, breakfast_available),
         lunch_available     = COALESCE($18, lunch_available),
         dinner_available    = COALESCE($19, dinner_available)
       WHERE user_id = $20
       RETURNING *`,
      [
        kitchen_name,
        bio,
        locality,
        city,
        cuisine_type,
        diet_type,
        price_per_day,
        capacity,
        upi_id,
        photo_url,
        phone,
        whatsapp,
        delivery_time,
        languages,
        working_hours,
        accept_new,
        breakfast_available,
        lunch_available,
        dinner_available,
        req.user.userId,
      ],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: "Provider profile not found" });
    }
    res.json({ provider: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/provider/upload-photo
// multipart/form-data, field name "photo". Streams to Cloudinary via
// multer-storage-cloudinary, then saves the returned URL onto the
// provider's photo_url column — the same field the customer app reads.
router.post(
  "/upload-photo",
  auth,
  requireProvider,
  upload.single("photo"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No photo uploaded" });
    }
    try {
      const result = await db.query(
        `UPDATE providers SET photo_url = $1 WHERE user_id = $2 RETURNING *`,
        [req.file.path, req.user.userId],
      );
      if (!result.rows[0]) {
        return res.status(404).json({ error: "Provider profile not found" });
      }
      res.json({ provider: result.rows[0], photo_url: req.file.path });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// PUT /api/provider/password — change password
router.put("/password", auth, requireProvider, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res
      .status(400)
      .json({ error: "current_password and new_password required" });
  }
  if (new_password.length < 6) {
    return res
      .status(400)
      .json({ error: "New password must be at least 6 characters" });
  }
  try {
    const userRes = await db.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [req.user.userId],
    );
    const valid = await bcrypt.compare(
      current_password,
      userRes.rows[0].password_hash,
    );
    if (!valid)
      return res.status(401).json({ error: "Current password is incorrect" });

    const newHash = await bcrypt.hash(new_password, 10);
    await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      newHash,
      req.user.userId,
    ]);
    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
