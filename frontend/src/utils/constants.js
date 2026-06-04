/**
 * Địa chỉ ví Admin (Owner) - chỉ ví này thấy giao diện quản trị.
 *
 * LƯU Ý BẢO MẬT:
 *   Việc ẩn/hiện giao diện admin bằng địa chỉ ví CHỈ là tính năng UI.
 *   Bảo mật thật sự đã được thực thi trong Smart Contract bằng modifier
 *   `onlyOwner`, nên dù ai đó "giả lập" địa chỉ ở frontend cũng không thể
 *   thực hiện được giao dịch withdraw on-chain.
 */
export const ADMIN_WALLET = "0x54d1BA8938A5bBc93cAc264cBd02c32F96e4f666";

export const isAdmin = (address) => {
  if (!address) return false;
  return address.toLowerCase() === ADMIN_WALLET.toLowerCase();
};

/** Trả về link tới Etherscan (mặc định Sepolia). */
export const EXPLORER_BASE = "https://sepolia.etherscan.io";

export const etherscanTx = (hash) => `${EXPLORER_BASE}/tx/${hash}`;
export const etherscanAddress = (addr) => `${EXPLORER_BASE}/address/${addr}`;
