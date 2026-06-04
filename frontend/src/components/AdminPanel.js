import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI, getContractInstance } from "../utils/contractUtils";
import { etherscanTx } from "../utils/constants";
import {
  listRequests,
  createRequest,
  updateRequest,
  deleteRequest,
  listWithdrawals,
  addWithdrawal,
  listProofs,
  createProof,
  deleteProof,
  uploadProofImage,
} from "../utils/api";
import {
  ensureAdminAuth,
  getStoredAdminAuth,
  clearAdminAuth,
} from "../utils/adminAuth";
import "./AdminPanel.css";

const TABS = [
  { id: "overview", label: "Tổng quan", icon: "📊" },
  { id: "requests", label: "Yêu cầu rút", icon: "📝" },
  { id: "withdraw", label: "Rút tiền", icon: "💸" },
  { id: "proof", label: "Đăng minh chứng", icon: "🧾" },
];

const formatDate = (ts) =>
  new Date(ts).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const AdminPanel = ({ userAccount, onWithdrawSuccess, onDataChange }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [contractBalance, setContractBalance] = useState("0");
  const [totalDonations, setTotalDonations] = useState("0");
  const [mainWallet, setMainWallet] = useState("");
  const [requests, setRequests] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [auth, setAuth] = useState(() => getStoredAdminAuth(userAccount));
  const [authError, setAuthError] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);

  const ensureAuth = useCallback(async () => {
    try {
      setAuthBusy(true);
      setAuthError(null);
      const a = await ensureAdminAuth(userAccount);
      setAuth(a);
      return a;
    } catch (err) {
      setAuthError(err.message || "Không thể xác thực admin.");
      throw err;
    } finally {
      setAuthBusy(false);
    }
  }, [userAccount]);

  const loadOnChainData = useCallback(async () => {
    try {
      const contract = await getContractInstance();
      if (!contract) return;
      const [balance, total, wallet] = await Promise.all([
        contract.getContractBalance(),
        contract.totalDonations(),
        contract.mainWallet(),
      ]);
      setContractBalance(ethers.formatEther(balance));
      setTotalDonations(ethers.formatEther(total));
      setMainWallet(wallet);
    } catch (err) {
      console.error("Load on-chain admin data error:", err);
    }
  }, []);

  const refreshLocal = useCallback(async () => {
    try {
      const [r, w, p] = await Promise.all([
        listRequests(),
        listWithdrawals(),
        listProofs(),
      ]);
      setRequests(r || []);
      setWithdrawals(w || []);
      setProofs(p || []);
    } catch (err) {
      console.error("Load API data error:", err);
    }
  }, []);

  useEffect(() => {
    loadOnChainData();
    refreshLocal();
    const t = setInterval(refreshLocal, 8000);
    return () => clearInterval(t);
  }, [loadOnChainData, refreshLocal]);

  useEffect(() => {
    setAuth(getStoredAdminAuth(userAccount));
  }, [userAccount]);

  const notifyChange = () => {
    refreshLocal();
    onDataChange && onDataChange();
  };

  const totalWithdrawn = withdrawals.reduce(
    (sum, w) => sum + parseFloat(w.amount || 0),
    0
  );

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div>
          <span className="admin-badge">
            <span className="dot" /> ADMIN
          </span>
          <h2>Bảng điều khiển quản trị</h2>
          <p className="admin-sub">
            Quản lý quỹ và minh bạch chi tiêu của chiến dịch
          </p>
        </div>
        <button
          className="admin-refresh"
          onClick={() => {
            loadOnChainData();
            refreshLocal();
          }}
          title="Làm mới dữ liệu"
        >
          ↻
        </button>
      </div>

      {!auth && (
        <div className="auth-banner">
          <div>
            <strong>Cần xác thực admin</strong>
            <p>
              Để thực hiện các thao tác quản trị (tạo yêu cầu, rút tiền, đăng
              minh chứng), vui lòng ký một message để máy chủ xác nhận bạn là
              chủ ví admin. Ký bằng MetaMask — không mất phí gas.
            </p>
            {authError && <div className="auth-err">{authError}</div>}
          </div>
          <button
            type="button"
            className="primary-btn auth-btn"
            disabled={authBusy}
            onClick={ensureAuth}
          >
            {authBusy ? "Đang chờ ký..." : "Ký xác thực với MetaMask"}
          </button>
        </div>
      )}

      {auth && (
        <div className="auth-pill">
          <span>
            ✓ Đã xác thực admin · hết hạn lúc{" "}
            <strong>{formatDate(auth.expiresAt)}</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              clearAdminAuth();
              setAuth(null);
            }}
          >
            Đăng xuất
          </button>
        </div>
      )}

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`admin-tab ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span className="tab-icon" aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-body">
        {activeTab === "overview" && (
          <OverviewTab
            contractBalance={contractBalance}
            totalDonations={totalDonations}
            totalWithdrawn={totalWithdrawn}
            mainWallet={mainWallet}
            requestsCount={requests.filter((r) => r.status === "pending").length}
            withdrawalsCount={withdrawals.length}
            proofsCount={proofs.length}
          />
        )}

        {activeTab === "requests" && (
          <RequestsTab
            requests={requests}
            ensureAuth={ensureAuth}
            notifyChange={notifyChange}
            onSelectAmount={(amt) => {
              setActiveTab("withdraw");
              window.sessionStorage.setItem(
                "admin:pendingWithdrawAmount",
                amt
              );
            }}
          />
        )}

        {activeTab === "withdraw" && (
          <WithdrawTab
            contractBalance={contractBalance}
            requests={requests}
            userAccount={userAccount}
            ensureAuth={ensureAuth}
            onSuccess={() => {
              notifyChange();
              loadOnChainData();
              onWithdrawSuccess && onWithdrawSuccess();
            }}
          />
        )}

        {activeTab === "proof" && (
          <ProofTab
            proofs={proofs}
            withdrawals={withdrawals}
            ensureAuth={ensureAuth}
            notifyChange={notifyChange}
          />
        )}
      </div>
    </div>
  );
};

/* ============================================================ */
/*                        SUB-COMPONENTS                         */
/* ============================================================ */

const OverviewTab = ({
  contractBalance,
  totalDonations,
  totalWithdrawn,
  mainWallet,
  requestsCount,
  withdrawalsCount,
  proofsCount,
}) => (
  <div className="overview">
    <div className="overview-grid">
      <div className="ov-card primary">
        <span className="ov-label">Số dư hiện tại trong hợp đồng</span>
        <span className="ov-value">
          {parseFloat(contractBalance).toFixed(4)} <small>ETH</small>
        </span>
        <span className="ov-foot">Có thể rút về ví chính</span>
      </div>
      <div className="ov-card success">
        <span className="ov-label">Tổng đã quyên góp</span>
        <span className="ov-value">
          {parseFloat(totalDonations).toFixed(4)} <small>ETH</small>
        </span>
        <span className="ov-foot">Trên blockchain</span>
      </div>
      <div className="ov-card warning">
        <span className="ov-label">Đã rút</span>
        <span className="ov-value">
          {totalWithdrawn.toFixed(4)} <small>ETH</small>
        </span>
        <span className="ov-foot">Theo lịch sử lưu trữ</span>
      </div>
    </div>

    <div className="overview-mini">
      <div className="mini-card">
        <span className="mini-num">{requestsCount}</span>
        <span className="mini-label">Yêu cầu chờ duyệt</span>
      </div>
      <div className="mini-card">
        <span className="mini-num">{withdrawalsCount}</span>
        <span className="mini-label">Lần rút đã thực hiện</span>
      </div>
      <div className="mini-card">
        <span className="mini-num">{proofsCount}</span>
        <span className="mini-label">Minh chứng đã đăng</span>
      </div>
    </div>

    <div className="overview-info">
      <div>
        <span className="info-label">Ví nhận tiền (mainWallet)</span>
        <span className="info-value mono">{mainWallet || "—"}</span>
      </div>
      <p className="info-note">
        Khi rút tiền, hợp đồng sẽ tự động chuyển ETH về ví ở trên.
        Modifier <code>onlyOwner</code> trong smart contract đảm bảo chỉ có
        chủ hợp đồng mới thực hiện được giao dịch này.
      </p>
    </div>
  </div>
);

const RequestsTab = ({ requests, ensureAuth, notifyChange, onSelectAmount }) => {
  const [form, setForm] = useState({ amount: "", reason: "", beneficiary: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ.");
      return;
    }
    if (!form.reason.trim()) {
      setError("Vui lòng nhập lý do rút tiền.");
      return;
    }
    try {
      setBusy(true);
      const auth = await ensureAuth();
      await createRequest(
        {
          amount: form.amount,
          reason: form.reason.trim(),
          beneficiary: form.beneficiary.trim(),
        },
        auth
      );
      setForm({ amount: "", reason: "", beneficiary: "" });
      notifyChange();
    } catch (err) {
      setError(err.message || "Không thể tạo yêu cầu.");
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async (r) => {
    try {
      const auth = await ensureAuth();
      await updateRequest(r.id, { status: "cancelled" }, auth);
      notifyChange();
    } catch (err) {
      window.alert(err.message);
    }
  };

  const onDelete = async (r) => {
    if (!window.confirm("Xóa yêu cầu này?")) return;
    try {
      const auth = await ensureAuth();
      await deleteRequest(r.id, auth);
      notifyChange();
    } catch (err) {
      window.alert(err.message);
    }
  };

  return (
    <div className="requests-tab">
      <form className="request-form" onSubmit={submit}>
        <h3>Tạo yêu cầu rút tiền</h3>
        <p className="form-hint">
          Yêu cầu được lưu trên máy chủ để mọi người có thể theo dõi.
          Khi đã sẵn sàng, sang tab <strong>Rút tiền</strong> để thực thi
          giao dịch on-chain.
        </p>

        <div className="row-2">
          <div className="field">
            <label>Số tiền (ETH)</label>
            <input
              type="number"
              step="0.0001"
              min="0"
              placeholder="0.5"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              disabled={busy}
            />
          </div>
          <div className="field">
            <label>Người/đơn vị thụ hưởng</label>
            <input
              type="text"
              placeholder="VD: Quỹ trẻ em vùng cao"
              value={form.beneficiary}
              onChange={(e) =>
                setForm({ ...form, beneficiary: e.target.value })
              }
              disabled={busy}
            />
          </div>
        </div>

        <div className="field">
          <label>Lý do / Mục đích sử dụng</label>
          <textarea
            rows={3}
            placeholder="Mô tả ngắn gọn mục đích sử dụng khoản tiền này..."
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            disabled={busy}
          />
        </div>

        {error && <div className="inline-error">{error}</div>}

        <button type="submit" className="primary-btn" disabled={busy}>
          {busy ? "Đang gửi..." : "+ Tạo yêu cầu"}
        </button>
      </form>

      <div className="request-list">
        <div className="list-head">
          <h3>Danh sách yêu cầu</h3>
          <span className="count-badge">{requests.length}</span>
        </div>
        {requests.length === 0 ? (
          <div className="empty-state">Chưa có yêu cầu rút tiền nào.</div>
        ) : (
          <ul>
            {requests.map((r) => (
              <li key={r.id} className={`request-item status-${r.status}`}>
                <div className="req-main">
                  <div className="req-amount">
                    {parseFloat(r.amount).toFixed(4)} <small>ETH</small>
                  </div>
                  <div className="req-info">
                    <div className="req-reason">{r.reason}</div>
                    {r.beneficiary && (
                      <div className="req-meta">
                        Thụ hưởng: <strong>{r.beneficiary}</strong>
                      </div>
                    )}
                    <div className="req-meta dim">{formatDate(r.createdAt)}</div>
                  </div>
                </div>
                <div className="req-actions">
                  <span className={`status-tag tag-${r.status}`}>
                    {r.status === "pending" && "Chờ thực hiện"}
                    {r.status === "completed" && "Đã hoàn tất"}
                    {r.status === "cancelled" && "Đã hủy"}
                  </span>
                  {r.status === "pending" && (
                    <>
                      <button
                        className="mini-btn primary"
                        onClick={() => onSelectAmount(r.amount)}
                      >
                        Rút ngay
                      </button>
                      <button
                        className="mini-btn ghost"
                        onClick={() => onCancel(r)}
                      >
                        Hủy
                      </button>
                    </>
                  )}
                  <button
                    className="mini-btn danger"
                    onClick={() => onDelete(r)}
                    title="Xóa"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const WithdrawTab = ({
  contractBalance,
  requests,
  userAccount,
  ensureAuth,
  onSuccess,
}) => {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [linkedRequest, setLinkedRequest] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [txHash, setTxHash] = useState(null);

  useEffect(() => {
    const pre = window.sessionStorage.getItem("admin:pendingWithdrawAmount");
    if (pre) {
      setAmount(pre);
      window.sessionStorage.removeItem("admin:pendingWithdrawAmount");
    }
  }, []);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const balance = parseFloat(contractBalance);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setTxHash(null);

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ.");
      return;
    }
    if (amt > balance) {
      setError("Số tiền vượt quá số dư trong hợp đồng.");
      return;
    }

    try {
      setIsLoading(true);
      const auth = await ensureAuth();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
      if (!contractAddress) throw new Error("Chưa cấu hình địa chỉ hợp đồng.");

      const contract = new ethers.Contract(
        contractAddress,
        CONTRACT_ABI,
        signer
      );
      const amountWei = ethers.parseEther(amount);

      const tx = await contract.withdraw(amountWei);
      setSuccess("Đã gửi giao dịch, đang chờ xác nhận trên blockchain...");
      const receipt = await tx.wait();

      if (receipt) {
        setTxHash(receipt.hash);
        await addWithdrawal(
          {
            amount,
            txHash: receipt.hash,
            requestId: linkedRequest || null,
            note: note.trim(),
          },
          auth
        );
        if (linkedRequest) {
          await updateRequest(
            linkedRequest,
            { status: "completed", txHash: receipt.hash },
            auth
          );
        }
        setSuccess(`Đã rút thành công ${amount} ETH về ví chính.`);
        setAmount("");
        setNote("");
        setLinkedRequest("");
        onSuccess && onSuccess();
      }
    } catch (err) {
      console.error(err);
      const msg =
        err?.shortMessage ||
        err?.reason ||
        err?.message ||
        "Không thể thực hiện giao dịch.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="withdraw-tab">
      <div className="balance-block">
        <span className="balance-label">Số dư hiện có trong hợp đồng</span>
        <span className="balance-value">
          {balance.toFixed(4)} <small>ETH</small>
        </span>
      </div>

      <form onSubmit={handleWithdraw} className="withdraw-form">
        <div className="field">
          <label>Số tiền muốn rút (ETH)</label>
          <input
            type="number"
            step="0.0001"
            min="0"
            max={balance}
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
          />
          <div className="quick-row">
            <button
              type="button"
              onClick={() => setAmount((balance * 0.25).toString())}
              disabled={isLoading || balance <= 0}
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => setAmount((balance * 0.5).toString())}
              disabled={isLoading || balance <= 0}
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => setAmount(balance.toString())}
              disabled={isLoading || balance <= 0}
            >
              Tối đa
            </button>
          </div>
        </div>

        {pendingRequests.length > 0 && (
          <div className="field">
            <label>Gắn với yêu cầu rút (tùy chọn)</label>
            <select
              value={linkedRequest}
              onChange={(e) => setLinkedRequest(e.target.value)}
              disabled={isLoading}
            >
              <option value="">— Không gắn —</option>
              {pendingRequests.map((r) => (
                <option key={r.id} value={r.id}>
                  {parseFloat(r.amount).toFixed(4)} ETH · {r.reason}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label>Ghi chú (tùy chọn)</label>
          <textarea
            rows={2}
            placeholder="VD: Rút để chuyển cho đối tác triển khai..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {error && <div className="inline-error">{error}</div>}
        {success && (
          <div className="inline-success">
            <p>{success}</p>
            {txHash && (
              <a
                href={etherscanTx(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="tx-link"
              >
                Xem giao dịch trên Etherscan ↗
              </a>
            )}
          </div>
        )}

        <button
          type="submit"
          className="primary-btn danger-btn"
          disabled={isLoading || !amount}
        >
          {isLoading ? "Đang xử lý..." : "Xác nhận rút tiền"}
        </button>

        <p className="security-note">
          🔒 Giao dịch sẽ được gửi từ ví <code>{userAccount?.slice(0, 6)}…
          {userAccount?.slice(-4)}</code> và phải vượt qua kiểm tra
          <code> onlyOwner</code> trong smart contract.
        </p>
      </form>
    </div>
  );
};

const ProofTab = ({ proofs, withdrawals, ensureAuth, notifyChange }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    withdrawalId: "",
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleFile = (f) => {
    setError(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (!/^image\//.test(f.type)) {
      setError("Chỉ chấp nhận file ảnh.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Ảnh tối đa 5MB.");
      return;
    }
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError("Vui lòng nhập tiêu đề minh chứng.");
      return;
    }
    try {
      setBusy(true);
      const auth = await ensureAuth();
      let imageUrl = form.imageUrl.trim();
      if (file) {
        const up = await uploadProofImage(file, auth);
        imageUrl = up.url;
      }
      await createProof(
        {
          title: form.title.trim(),
          description: form.description.trim(),
          imageUrl,
          withdrawalId: form.withdrawalId || null,
        },
        auth
      );
      setForm({ title: "", description: "", imageUrl: "", withdrawalId: "" });
      setFile(null);
      notifyChange();
    } catch (err) {
      setError(err.message || "Không thể đăng minh chứng.");
    } finally {
      setBusy(false);
    }
  };

  const removeProof = async (p) => {
    if (!window.confirm("Xóa minh chứng này?")) return;
    try {
      const auth = await ensureAuth();
      await deleteProof(p.id, auth);
      notifyChange();
    } catch (err) {
      window.alert(err.message);
    }
  };

  return (
    <div className="proof-tab">
      <form className="proof-form" onSubmit={submit}>
        <h3>Đăng minh chứng sử dụng tiền</h3>
        <p className="form-hint">
          Đăng tải hình ảnh / mô tả về cách sử dụng khoản tiền đã rút.
          Người ủng hộ có thể xem ở phần "Minh bạch chi tiêu".
        </p>

        <div className="field">
          <label>Tiêu đề</label>
          <input
            type="text"
            placeholder="VD: Trao quà cho 50 em nhỏ tại Sa Pa"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            disabled={busy}
          />
        </div>

        <div className="field">
          <label>Mô tả chi tiết</label>
          <textarea
            rows={3}
            placeholder="Mô tả hoạt động, địa điểm, thời gian, số tiền sử dụng..."
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            disabled={busy}
          />
        </div>

        <div className="field">
          <label>Tải ảnh lên (≤ 5MB) hoặc dán URL</label>
          <input
            type="text"
            placeholder="https://..."
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            disabled={busy || !!file}
          />
          <div className="upload-row">
            <label className="file-btn">
              {file ? `📷 ${file.name}` : "📷 Chọn ảnh từ máy"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0])}
                disabled={busy}
              />
            </label>
            {file && (
              <button
                type="button"
                className="mini-btn ghost"
                onClick={() => setFile(null)}
              >
                Xóa ảnh
              </button>
            )}
          </div>
          {file && (
            <div className="preview">
              <img
                src={URL.createObjectURL(file)}
                alt="Xem trước minh chứng"
              />
            </div>
          )}
        </div>

        {withdrawals.length > 0 && (
          <div className="field">
            <label>Liên kết với lần rút (tùy chọn)</label>
            <select
              value={form.withdrawalId}
              onChange={(e) =>
                setForm({ ...form, withdrawalId: e.target.value })
              }
              disabled={busy}
            >
              <option value="">— Không liên kết —</option>
              {withdrawals.map((w) => (
                <option key={w.id} value={w.id}>
                  {parseFloat(w.amount).toFixed(4)} ETH ·{" "}
                  {formatDate(w.createdAt)}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <div className="inline-error">{error}</div>}
        <button type="submit" className="primary-btn" disabled={busy}>
          {busy ? "Đang đăng..." : "+ Đăng minh chứng"}
        </button>
      </form>

      <div className="proof-list">
        <div className="list-head">
          <h3>Minh chứng đã đăng</h3>
          <span className="count-badge">{proofs.length}</span>
        </div>
        {proofs.length === 0 ? (
          <div className="empty-state">Chưa có minh chứng nào.</div>
        ) : (
          <ul>
            {proofs.map((p) => (
              <li key={p.id} className="proof-item">
                {p.imageUrl && (
                  <div className="proof-thumb">
                    <img src={p.imageUrl} alt={p.title} />
                  </div>
                )}
                <div className="proof-body">
                  <div className="proof-title-row">
                    <h4>{p.title}</h4>
                    <button
                      className="mini-btn danger"
                      onClick={() => removeProof(p)}
                      title="Xóa"
                    >
                      ✕
                    </button>
                  </div>
                  {p.description && <p>{p.description}</p>}
                  <span className="proof-date">{formatDate(p.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
