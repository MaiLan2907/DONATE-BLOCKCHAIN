const express = require("express");
const { Withdrawals } = require("../db");
const { adminAuth } = require("../middleware/adminAuth");

const router = express.Router();

router.get("/", (_req, res) => {
  res.json(Withdrawals.list());
});

router.post("/", adminAuth, (req, res) => {
  const { amount, txHash, requestId, note } = req.body || {};
  if (!amount || !txHash) {
    return res
      .status(400)
      .json({ error: "Thiếu số tiền hoặc mã giao dịch." });
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    return res.status(400).json({ error: "Mã giao dịch không hợp lệ." });
  }
  const item = Withdrawals.create({
    amount: String(amount),
    txHash,
    requestId: requestId || null,
    note: note ? String(note).trim() : null,
  });
  res.status(201).json(item);
});

module.exports = router;
