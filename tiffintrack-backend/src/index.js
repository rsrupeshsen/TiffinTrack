const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
  }),
);

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/providers", require("./routes/providers"));
app.use("/api/subscriptions", require("./routes/subscriptions"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/enquiries", require("./routes/enquiries"));
app.use("/api/provider", require("./routes/provider/dashboard"));
app.use("/api/provider", require("./routes/provider/menu"));
app.use("/api/provider", require("./routes/provider/subscribers"));
app.use("/api/provider", require("./routes/provider/plans"));
app.use("/api/provider", require("./routes/provider/profile"));

const server = require("http").createServer(app);
require("./websocket")(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log("TiffinTrack backend running on port", PORT),
);
