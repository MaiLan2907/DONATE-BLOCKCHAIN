/**
 * Quản lý chữ ký đăng nhập admin.
 *
 * Quy trình:
 *   1. Khi cần gọi API ghi (POST/PATCH/DELETE), gọi `ensureAdminAuth(address)`.
 *   2. Nếu chưa có chữ ký (hoặc đã hết hạn / sai địa chỉ), MetaMask sẽ bật
 *      popup yêu cầu admin ký vào message:
 *        "DONATE_BLOCKCHAIN_ADMIN_LOGIN:{address}:{issuedAt}"
 *   3. Chữ ký được lưu vào localStorage và gửi kèm header cho các request sau.
 *
 * Lưu ý: chữ ký này CHỈ là token xác thực để gọi backend. Việc rút tiền
 * thực sự vẫn được smart contract kiểm tra bằng modifier `onlyOwner`.
 */

import { ethers } from "ethers";
import { adminLogin } from "./api";

const STORAGE_KEY = "donateBlockchain:adminAuth";
// Mặc định: 12 giờ (server cũng có TTL riêng, lấy giá trị nhỏ hơn).
const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000;

const buildMessage = (address, issuedAt) =>
  `DONATE_BLOCKCHAIN_ADMIN_LOGIN:${address.toLowerCase()}:${issuedAt}`;

const readStored = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

const writeStored = (auth) => {
  if (auth) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent("adminAuth:change"));
};

export const getStoredAdminAuth = (address) => {
  const stored = readStored();
  if (!stored) return null;
  if (address && stored.address.toLowerCase() !== address.toLowerCase()) {
    return null;
  }
  if (stored.expiresAt && Date.now() > stored.expiresAt) {
    return null;
  }
  return stored;
};

export const clearAdminAuth = () => writeStored(null);

/**
 * Xin chữ ký từ MetaMask và xác thực với backend.
 * Trả về `{ address, signature, issuedAt, expiresAt }` hoặc throw.
 */
export const signInAdmin = async (address) => {
  if (!window.ethereum) {
    throw new Error("Không tìm thấy MetaMask.");
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner(address);

  const issuedAt = Date.now();
  const message = buildMessage(address, issuedAt);
  const signature = await signer.signMessage(message);

  let serverResp;
  try {
    serverResp = await adminLogin({ address, signature, issuedAt });
  } catch (err) {
    throw new Error(err.message || "Không thể xác thực admin với máy chủ.");
  }

  const auth = {
    address: address.toLowerCase(),
    signature,
    issuedAt,
    expiresAt: serverResp?.expiresAt || issuedAt + DEFAULT_TTL_MS,
  };
  writeStored(auth);
  return auth;
};

/**
 * Đảm bảo có chữ ký admin hợp lệ. Nếu chưa có, mở MetaMask để ký.
 */
export const ensureAdminAuth = async (address) => {
  const stored = getStoredAdminAuth(address);
  if (stored) return stored;
  return signInAdmin(address);
};

export const onAdminAuthChange = (cb) => {
  const handler = () => cb(readStored());
  window.addEventListener("adminAuth:change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("adminAuth:change", handler);
    window.removeEventListener("storage", handler);
  };
};
