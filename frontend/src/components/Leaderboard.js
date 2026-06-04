import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getContractInstance } from "../utils/contractUtils";
import "./Leaderboard.css";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      const contract = await getContractInstance();

      if (contract) {
        const [addresses, amounts] = await contract.getLeaderboard(10);

        const leaderboardData = addresses.map((address, index) => ({
          rank: index + 1,
          address: address,
          amount: ethers.formatEther(amounts[index]),
        }));

        setLeaderboard(leaderboardData);
        setError(null);
      }
    } catch (err) {
      console.error("Error loading leaderboard:", err);
      setError("Không thể tải bảng xếp hạng. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const rankBadge = (index) => {
    if (index === 0) return { emoji: "🥇", label: "Hạng 1" };
    if (index === 1) return { emoji: "🥈", label: "Hạng 2" };
    if (index === 2) return { emoji: "🥉", label: "Hạng 3" };
    return { emoji: `#${index + 1}`, label: `Hạng ${index + 1}` };
  };

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <div>
          <h2>Bảng xếp hạng nhà hảo tâm</h2>
          <p className="leaderboard-sub">
            Top 10 nhà tài trợ đóng góp nhiều nhất
          </p>
        </div>
        <button
          className="refresh-btn"
          onClick={loadLeaderboard}
          disabled={isLoading}
          title="Làm mới"
          aria-label="Làm mới bảng xếp hạng"
        >
          <span className={isLoading ? "spin" : ""}>↻</span>
        </button>
      </div>

      {isLoading && leaderboard.length === 0 ? (
        <div className="state loading">
          <div className="skeleton-row" />
          <div className="skeleton-row" />
          <div className="skeleton-row" />
        </div>
      ) : error ? (
        <div className="state error">{error}</div>
      ) : leaderboard.length === 0 ? (
        <div className="state empty">
          <div className="empty-emoji" aria-hidden="true">✨</div>
          <p className="empty-title">Chưa có khoản quyên góp nào</p>
          <p className="empty-desc">Hãy trở thành nhà hảo tâm đầu tiên!</p>
        </div>
      ) : (
        <ul className="leaderboard-list">
          {leaderboard.map((donor, index) => {
            const badge = rankBadge(index);
            const isTop = index < 3;
            return (
              <li
                key={donor.address}
                className={`donor-row rank-${index + 1} ${isTop ? "is-top" : ""}`}
              >
                <div className="rank-cell" aria-label={badge.label}>
                  <span className="rank-badge">{badge.emoji}</span>
                </div>
                <div className="address-cell">
                  <span className="address mono">{formatAddress(donor.address)}</span>
                  <span className="address-sub">Nhà hảo tâm</span>
                </div>
                <div className="amount-cell">
                  <span className="amount">{parseFloat(donor.amount).toFixed(4)}</span>
                  <span className="amount-unit">ETH</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="leaderboard-foot">
        Tự động làm mới mỗi 10 giây · Dữ liệu trực tiếp từ blockchain
      </p>
    </div>
  );
};

export default Leaderboard;
