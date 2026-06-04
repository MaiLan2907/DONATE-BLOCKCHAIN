const path = require("path");
const fs = require("fs");

// Sử dụng node:sqlite (built-in của Node.js, không cần native compile).
// Có sẵn từ Node v22.5+ (với flag --experimental-sqlite) và stable từ v24+.
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = path.resolve(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbPath = path.join(DATA_DIR, "donate.sqlite");
const db = new DatabaseSync(dbPath);

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS requests (
    id           TEXT PRIMARY KEY,
    amount       TEXT NOT NULL,
    reason       TEXT NOT NULL,
    beneficiary  TEXT,
    status       TEXT NOT NULL DEFAULT 'pending',
    tx_hash      TEXT,
    created_at   INTEGER NOT NULL,
    updated_at   INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS withdrawals (
    id           TEXT PRIMARY KEY,
    amount       TEXT NOT NULL,
    tx_hash      TEXT NOT NULL,
    request_id   TEXT,
    note         TEXT,
    created_at   INTEGER NOT NULL,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS proofs (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    description   TEXT,
    image_url     TEXT,
    withdrawal_id TEXT,
    created_at    INTEGER NOT NULL,
    FOREIGN KEY (withdrawal_id) REFERENCES withdrawals(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_requests_created    ON requests(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_withdrawals_created ON withdrawals(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_proofs_created      ON proofs(created_at DESC);
`);

/* ---------- Helpers ---------- */

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const camel = (row) => {
  if (!row) return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const key = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[key] = v;
  }
  return out;
};

const all = (rows) => rows.map(camel);

/* ---------- Requests ---------- */

const insertRequest = db.prepare(`
  INSERT INTO requests (id, amount, reason, beneficiary, status, created_at, updated_at)
  VALUES (@id, @amount, @reason, @beneficiary, @status, @createdAt, @updatedAt)
`);
const selectRequests = db.prepare(
  "SELECT * FROM requests ORDER BY created_at DESC"
);
const selectRequest = db.prepare("SELECT * FROM requests WHERE id = ?");
const updateRequestStmt = db.prepare(`
  UPDATE requests
  SET status = COALESCE(@status, status),
      tx_hash = COALESCE(@txHash, tx_hash),
      updated_at = @updatedAt
  WHERE id = @id
`);
const deleteRequestStmt = db.prepare("DELETE FROM requests WHERE id = ?");

const Requests = {
  list() {
    return all(selectRequests.all());
  },
  get(id) {
    return camel(selectRequest.get(id));
  },
  create({ amount, reason, beneficiary }) {
    const now = Date.now();
    const id = uid();
    insertRequest.run({
      id,
      amount: String(amount),
      reason,
      beneficiary: beneficiary || null,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    return this.get(id);
  },
  update(id, { status, txHash }) {
    updateRequestStmt.run({
      id,
      status: status ?? null,
      txHash: txHash ?? null,
      updatedAt: Date.now(),
    });
    return this.get(id);
  },
  delete(id) {
    return deleteRequestStmt.run(id).changes > 0;
  },
};

/* ---------- Withdrawals ---------- */

const insertWithdrawal = db.prepare(`
  INSERT INTO withdrawals (id, amount, tx_hash, request_id, note, created_at)
  VALUES (@id, @amount, @txHash, @requestId, @note, @createdAt)
`);
const selectWithdrawals = db.prepare(
  "SELECT * FROM withdrawals ORDER BY created_at DESC"
);
const selectWithdrawal = db.prepare("SELECT * FROM withdrawals WHERE id = ?");
const findWithdrawByTx = db.prepare(
  "SELECT * FROM withdrawals WHERE LOWER(tx_hash) = LOWER(?)"
);

const Withdrawals = {
  list() {
    return all(selectWithdrawals.all());
  },
  get(id) {
    return camel(selectWithdrawal.get(id));
  },
  create({ amount, txHash, requestId, note }) {
    const existed = findWithdrawByTx.get(txHash);
    if (existed) return camel(existed);
    const id = uid();
    insertWithdrawal.run({
      id,
      amount: String(amount),
      txHash,
      requestId: requestId || null,
      note: note || null,
      createdAt: Date.now(),
    });
    return this.get(id);
  },
};

/* ---------- Proofs ---------- */

const insertProof = db.prepare(`
  INSERT INTO proofs (id, title, description, image_url, withdrawal_id, created_at)
  VALUES (@id, @title, @description, @imageUrl, @withdrawalId, @createdAt)
`);
const selectProofs = db.prepare(
  "SELECT * FROM proofs ORDER BY created_at DESC"
);
const selectProof = db.prepare("SELECT * FROM proofs WHERE id = ?");
const deleteProofStmt = db.prepare("DELETE FROM proofs WHERE id = ?");

const Proofs = {
  list() {
    return all(selectProofs.all());
  },
  get(id) {
    return camel(selectProof.get(id));
  },
  create({ title, description, imageUrl, withdrawalId }) {
    const id = uid();
    insertProof.run({
      id,
      title,
      description: description || null,
      imageUrl: imageUrl || null,
      withdrawalId: withdrawalId || null,
      createdAt: Date.now(),
    });
    return this.get(id);
  },
  delete(id) {
    return deleteProofStmt.run(id).changes > 0;
  },
};

module.exports = { db, Requests, Withdrawals, Proofs };
