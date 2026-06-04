/**
 * Client gọi backend API.
 *
 * Tất cả endpoint READ (GET) đều public.
 * Các endpoint WRITE yêu cầu 3 header lấy từ `adminAuth.js`:
 *   X-Admin-Address, X-Admin-Issued-At, X-Admin-Signature
 */

const BASE = (
  process.env.REACT_APP_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

export const apiUrl = (path) => `${BASE}${path}`;

const buildAdminHeaders = (auth) => {
  if (!auth) return {};
  return {
    "X-Admin-Address": auth.address,
    "X-Admin-Issued-At": String(auth.issuedAt),
    "X-Admin-Signature": auth.signature,
  };
};

const parse = async (res) => {
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    /* not json */
  }
  if (!res.ok) {
    const message =
      (data && data.error) || `${res.status} ${res.statusText || "Lỗi"}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

const request = async (path, { method = "GET", body, auth, headers } = {}) => {
  const opts = {
    method,
    headers: {
      Accept: "application/json",
      ...(body && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...buildAdminHeaders(auth),
      ...(headers || {}),
    },
  };
  if (body) {
    opts.body = body instanceof FormData ? body : JSON.stringify(body);
  }
  const res = await fetch(apiUrl(path), opts);
  return parse(res);
};

/* ---------- Health ---------- */
export const getHealth = () => request("/api/health");

/* ---------- Auth ---------- */
export const adminLogin = ({ address, signature, issuedAt }) =>
  request("/api/admin/auth/login", {
    method: "POST",
    body: { address, signature, issuedAt },
  });

/* ---------- Requests ---------- */
export const listRequests = () => request("/api/requests");

export const createRequest = (payload, auth) =>
  request("/api/requests", { method: "POST", body: payload, auth });

export const updateRequest = (id, patch, auth) =>
  request(`/api/requests/${id}`, { method: "PATCH", body: patch, auth });

export const deleteRequest = (id, auth) =>
  request(`/api/requests/${id}`, { method: "DELETE", auth });

/* ---------- Withdrawals ---------- */
export const listWithdrawals = () => request("/api/withdrawals");

export const addWithdrawal = (payload, auth) =>
  request("/api/withdrawals", { method: "POST", body: payload, auth });

/* ---------- Proofs ---------- */
export const listProofs = () => request("/api/proofs");

export const createProof = (payload, auth) =>
  request("/api/proofs", { method: "POST", body: payload, auth });

export const deleteProof = (id, auth) =>
  request(`/api/proofs/${id}`, { method: "DELETE", auth });

export const uploadProofImage = async (file, auth) => {
  const fd = new FormData();
  fd.append("image", file);
  return request("/api/proofs/upload", { method: "POST", body: fd, auth });
};
