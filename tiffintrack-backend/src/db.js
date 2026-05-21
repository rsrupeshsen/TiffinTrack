const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool
  .connect()
  .then(() => console.log("✅ Neon Postgres connected"))
  .catch((err) => console.error("❌ DB connection failed:", err.message));

module.exports = pool;
