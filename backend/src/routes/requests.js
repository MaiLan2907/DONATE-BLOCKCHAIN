const express = require("express");
const { Requests } = require("../db");
const { adminAuth } = require("../middleware/adminAuth");

const router = express.Router();

router.get("/", (_req, res) => {
  res.json(Requests.list());
});

router.post("/", adminAuth, (req, res) => {
  const { amount, reason, beneficiary } = req.body || {};
  if (!amount || !reason) {
    return res
      .status(400)
      .json({ error: "Thiếu số tiền hoặc lý do." });
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ error: "Số tiền phải lớn hơn 0." });
  }
  const item = Requests.create({
    amount: String(amount),
    reason: String(reason).trim(),
    beneficiary: beneficiary ? String(beneficiary).trim() : null,
  });
  res.status(201).json(item);
});

router.patch("/:id", adminAuth, (req, res) => {
  const { status, txHash } = req.body || {};
  const existing = Requests.get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Không tìm thấy yêu cầu." });
  }
  const updated = Requests.update(req.params.id, { status, txHash });
  res.json(updated);
});

router.delete("/:id", adminAuth, (req, res) => {
  const removed = Requests.delete(req.params.id);
  if (!removed) {
    return res.status(404).json({ error: "Không tìm thấy yêu cầu." });
  }
  res.json({ ok: true });
});

module.exports = router;
