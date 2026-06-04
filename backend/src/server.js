require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const { Requests, Withdrawals, Proofs } = require("./db");
const authRoutes = require("./routes/auth");
const requestsRoutes = require("./routes/requests");
const withdrawalsRoutes = require("./routes/withdrawals");
const proofsRoutes = require("./routes/proofs");

const PORT = Number(process.env.PORT || 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const app = express();

app.use(
  cors({
    origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: false,
  })
);
app.use(express.json({ limit: "1mb" }));

app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "..", "uploads"), {
    maxAge: "30d",
    fallthrough: true,
  })
);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "donate-blockchain-backend",
    time: new Date().toISOString(),
    counts: {
      requests: Requests.list().length,
      withdrawals: Withdrawals.list().length,
      proofs: Proofs.list().length,
    },
  });
});

app.use("/api/admin/auth", authRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/withdrawals", withdrawalsRoutes);
app.use("/api/proofs", proofsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err && err.message && err.code) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || "Lỗi máy chủ." });
});

app.listen(PORT, () => {
  console.log(`✓ Donate Blockchain API listening on http://localhost:${PORT}`);
  console.log(`  ADMIN_WALLET = ${process.env.ADMIN_WALLET || "(chưa cấu hình)"}`);
});
