import React, { useState, useEffect, useCallback } from "react";
import { listWithdrawals, listProofs } from "../utils/api";
import { etherscanTx } from "../utils/constants";
import "./PublicHistory.css";

const TABS = [
  { id: "withdrawals", label: "Lịch sử rút tiền", icon: "💸" },
  { id: "proofs", label: "Minh chứng chi tiêu", icon: "🧾" },
];

const formatDate = (ts) =>
  new Date(ts).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const PublicHistory = ({ refreshKey }) => {
  const [tab, setTab] = useState("withdrawals");
  const [withdrawals, setWithdrawals] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const [w, p] = await Promise.all([listWithdrawals(), listProofs()]);
      setWithdrawals(w || []);
      setProofs(p || []);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err.message ||
          "Không thể tải dữ liệu minh bạch. Kiểm tra backend đã chạy chưa."
      );
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload, refreshKey]);

  // Tự động cập nhật mỗi 8 giây để mọi browser thấy dữ liệu mới nhất.
  useEffect(() => {
    const t = setInterval(reload, 8000);
    return () => clearInterval(t);
  }, [reload]);

  const totalWithdrawn = withdrawals.reduce(
    (s, w) => s + parseFloat(w.amount || 0),
    0
  );

  return (
    <section className="public-history">
      <div className="ph-head">
        <div>
          <h2>Minh bạch chi tiêu</h2>
          <p className="ph-sub">
            Lịch sử các lần rút tiền và minh chứng sử dụng do quản trị viên công bố.
            Tất cả giao dịch đều có thể đối chiếu trên blockchain.
          </p>
        </div>
        <div className="ph-stats">
          <div className="ph-stat">
            <span className="ph-stat-num">{withdrawals.length}</span>
            <span className="ph-stat-label">lần rút</span>
          </div>
          <div className="ph-stat">
            <span className="ph-stat-num">{totalWithdrawn.toFixed(4)}</span>
            <span className="ph-stat-label">ETH đã rút</span>
          </div>
          <div className="ph-stat">
            <span className="ph-stat-num">{proofs.length}</span>
            <span className="ph-stat-label">minh chứng</span>
          </div>
        </div>
      </div>

      <div className="ph-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`ph-tab ${tab === t.id ? "active" : ""}`}
          >
            <span aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {loadError && <div className="ph-load-error">{loadError}</div>}

      {tab === "withdrawals" &&
        (withdrawals.length === 0 ? (
          <div className="ph-empty">
            <div className="emoji" aria-hidden="true">🪙</div>
            <p className="ph-empty-title">Chưa có lịch sử rút tiền</p>
            <p className="ph-empty-desc">
              Toàn bộ số tiền vẫn đang nằm trong hợp đồng thông minh.
            </p>
          </div>
        ) : (
          <div className="timeline">
            {withdrawals.map((w) => (
              <div key={w.id} className="timeline-item">
                <div className="timeline-marker">
                  <span>💸</span>
                </div>
                <div className="timeline-content">
                  <div className="ti-head">
                    <div>
                      <span className="ti-amount">
                        {parseFloat(w.amount).toFixed(4)}{" "}
                        <small>ETH</small>
                      </span>
                      <span className="ti-date">{formatDate(w.createdAt)}</span>
                    </div>
                    {w.txHash && (
                      <a
                        className="ti-tx"
                        href={etherscanTx(w.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Xem giao dịch ↗
                      </a>
                    )}
                  </div>
                  {w.note && <p className="ti-note">{w.note}</p>}
                  {w.txHash && (
                    <div className="ti-hash mono" title={w.txHash}>
                      {w.txHash.slice(0, 18)}…{w.txHash.slice(-10)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === "proofs" &&
        (proofs.length === 0 ? (
          <div className="ph-empty">
            <div className="emoji" aria-hidden="true">📷</div>
            <p className="ph-empty-title">Chưa có minh chứng nào</p>
            <p className="ph-empty-desc">
              Quản trị viên sẽ đăng tải hình ảnh / mô tả khi sử dụng quỹ.
            </p>
          </div>
        ) : (
          <div className="proof-grid">
            {proofs.map((p) => (
              <article key={p.id} className="proof-card">
                {p.imageUrl ? (
                  <button
                    type="button"
                    className="proof-image"
                    onClick={() => setLightbox(p)}
                  >
                    <img src={p.imageUrl} alt={p.title} />
                  </button>
                ) : (
                  <div className="proof-image no-image">Không có ảnh</div>
                )}
                <div className="proof-content">
                  <h3>{p.title}</h3>
                  {p.description && <p>{p.description}</p>}
                  <span className="proof-meta">{formatDate(p.createdAt)}</span>
                </div>
              </article>
            ))}
          </div>
        ))}

      {lightbox && (
        <div
          className="lightbox"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setLightbox(null)}
            aria-label="Đóng"
          >
            ✕
          </button>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            {lightbox.imageUrl && (
              <img src={lightbox.imageUrl} alt={lightbox.title} />
            )}
            <div className="lightbox-text">
              <h3>{lightbox.title}</h3>
              {lightbox.description && <p>{lightbox.description}</p>}
              <span className="proof-meta">
                {formatDate(lightbox.createdAt)}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PublicHistory;
