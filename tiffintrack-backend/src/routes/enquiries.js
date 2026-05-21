const router = require("express").Router();
const db = require("../db");

// POST /api/enquiries — kitchen listing application
router.post("/", async (req, res) => {
  const { name, phone, city, cuisine, capacity, bio } = req.body;
  if (!name || !phone)
    return res.status(400).json({ error: "name and phone required" });
  try {
    const result = await db.query(
      `INSERT INTO enquiries (name, phone, city, cuisine, capacity, bio, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING id`,
      [name, phone, city, cuisine, capacity, bio],
    );
    res
      .status(201)
      .json({
        id: result.rows[0].id,
        message: "Enquiry submitted. We will call you within 24 hours.",
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
