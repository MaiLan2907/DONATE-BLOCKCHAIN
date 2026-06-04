const { ethers } = require("ethers");

/**
 * Quy ước message admin ký bằng MetaMask:
 *
 *   "DONATE_BLOCKCHAIN_ADMIN_LOGIN:{address}:{issuedAt}"
 *
 *   - address    : ví của admin (chữ thường)
 *   - issuedAt   : Date.now() ở client khi ký
 *
 * Khi gọi các endpoint admin, frontend gửi 3 header sau:
 *   X-Admin-Address    -> ví đã ký
 *   X-Admin-Signature  -> chữ ký EIP-191 do MetaMask trả về
 *   X-Admin-Issued-At  -> timestamp lúc ký (ms)
 *
 * Middleware sẽ:
 *   1. Dựng lại message
 *   2. Gọi ethers.verifyMessage(message, signature) để khôi phục địa chỉ ký
 *   3. So sánh với ADMIN_WALLET trong .env
 *   4. Kiểm tra chữ ký chưa hết hạn (ADMIN_SIGNATURE_TTL_MIN)
 */

const ttlMin = parseInt(process.env.ADMIN_SIGNATURE_TTL_MIN || "720", 10);

const buildMessage = (address, issuedAt) =>
  `DONATE_BLOCKCHAIN_ADMIN_LOGIN:${address.toLowerCase()}:${issuedAt}`;

const verifyAdminSignature = ({ address, signature, issuedAt }) => {
  if (!address || !signature || !issuedAt) {
    return { ok: false, reason: "Thiếu thông tin xác thực admin." };
  }

  const adminWallet = (process.env.ADMIN_WALLET || "").toLowerCase();
  if (!adminWallet) {
    return { ok: false, reason: "Server chưa cấu hình ADMIN_WALLET." };
  }

  if (address.toLowerCase() !== adminWallet) {
    return { ok: false, reason: "Địa chỉ ví không phải admin." };
  }

  const issuedAtMs = Number(issuedAt);
  if (!Number.isFinite(issuedAtMs)) {
    return { ok: false, reason: "Timestamp không hợp lệ." };
  }

  const ageMin = (Date.now() - issuedAtMs) / 60000;
  if (ageMin < -5) {
    return { ok: false, reason: "Timestamp ở tương lai." };
  }
  if (ageMin > ttlMin) {
    return { ok: false, reason: "Chữ ký admin đã hết hạn, vui lòng đăng nhập lại." };
  }

  let recovered;
  try {
    const message = buildMessage(address, issuedAtMs);
    recovered = ethers.verifyMessage(message, signature);
  } catch (err) {
    return { ok: false, reason: "Chữ ký không hợp lệ." };
  }

  if (recovered.toLowerCase() !== adminWallet) {
    return { ok: false, reason: "Chữ ký không khớp với ví admin." };
  }

  return { ok: true, address: recovered };
};

const adminAuth = (req, res, next) => {
  const result = verifyAdminSignature({
    address: req.header("x-admin-address"),
    signature: req.header("x-admin-signature"),
    issuedAt: req.header("x-admin-issued-at"),
  });

  if (!result.ok) {
    return res.status(401).json({ error: result.reason });
  }

  req.adminAddress = result.address;
  next();
};

module.exports = { adminAuth, verifyAdminSignature, buildMessage };
