const express = require("express");
const { verifyAdminSignature, buildMessage } = require("../middleware/adminAuth");

const router = express.Router();

/**
 * Trả về message mẫu admin cần ký bằng MetaMask.
 * Frontend có thể tự dựng message theo công thức này (không bắt buộc gọi).
 */
router.get("/message", (req, res) => {
  const address = String(req.query.address || "").toLowerCase();
  const issuedAt = Number(req.query.issuedAt) || Date.now();
  if (!address) {
    return res.status(400).json({ error: "Thiếu address." });
  }
  res.json({
    message: buildMessage(address, issuedAt),
    issuedAt,
  });
});

/**
 * Xác minh chữ ký admin. Nếu hợp lệ, frontend có thể lưu address+signature+issuedAt
 * và gửi qua header cho các endpoint khác.
 */
router.post("/login", (req, res) => {
  const { address, signature, issuedAt } = req.body || {};
  const result = verifyAdminSignature({ address, signature, issuedAt });
  if (!result.ok) {
    return res.status(401).json({ error: result.reason });
  }
  res.json({
    ok: true,
    address: result.address,
    expiresAt:
      Number(issuedAt) +
      parseInt(process.env.ADMIN_SIGNATURE_TTL_MIN || "720", 10) * 60_000,
  });
});

module.exports = router;
