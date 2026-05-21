const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: "*" }));
app.use(helmet());
app.use(express.json());

// Health check — verify this works before adding routes
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/health2", (req, res) => {
  try {
    const now = new Date();

    // Format IST time in ISO-like format
    const istTime = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);

    res.json({
      status: "ok",
      utc: now.toISOString(), // UTC time
      ist: istTime.replace(",", ""), // IST time
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── Routes (uncomment each one AFTER you create the file) ──────────────────
// app.use('/api/auth',          require('./routes/auth'));
app.use('/api/providers',     require('./routes/providers'));
// app.use('/api/subscriptions', require('./routes/subscriptions'));
// app.use('/api/reviews',       require('./routes/reviews'));
// app.use('/api/chat',          require('./routes/chat'));
// app.use('/api/enquiries',     require('./routes/enquiries'));
// app.use('/api/provider',      require('./routes/provider/dashboard'));
// app.use('/api/provider',      require('./routes/provider/menu'));
// app.use('/api/provider',      require('./routes/provider/subscribers'));
// app.use('/api/provider',      require('./routes/provider/plans'));
// app.use('/api/provider',      require('./routes/provider/profile'));

// WebSocket for delivery tracking (uncomment after creating websocket.js)
// require('./websocket')(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`TiffinTrack backend running on port ${PORT}`),
);
