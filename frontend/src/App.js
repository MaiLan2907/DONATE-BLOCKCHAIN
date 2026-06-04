import React, { useState } from "react";
import WalletConnect from "./components/WalletConnect";
import DonationForm from "./components/DonationForm";
import Leaderboard from "./components/Leaderboard";
import Statistics from "./components/Statistics";
import AdminPanel from "./components/AdminPanel";
import PublicHistory from "./components/PublicHistory";
import { isAdmin } from "./utils/constants";
import "./App.css";

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [userAccount, setUserAccount] = useState(null);
  const [contractData, setContractData] = useState({
    totalDonations: "0",
    donorCount: 0,
    campaignName: "Hệ thống Quyên góp Từ thiện Minh bạch",
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [adminView, setAdminView] = useState("admin"); // "admin" | "donate"

  const handleWalletConnected = (account) => {
    setIsConnected(true);
    setUserAccount(account);
    setAdminView(isAdmin(account) ? "admin" : "donate");
  };

  const handleWalletDisconnected = () => {
    setIsConnected(false);
    setUserAccount(null);
  };

  const handleDonationSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const updateContractData = (data) => {
    setContractData(data);
  };

  const userIsAdmin = isConnected && isAdmin(userAccount);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-container">
          <div className="header-content">
            <div className="brand">
              <div className="brand-logo" aria-hidden="true">
                <span>♥</span>
              </div>
              <div className="brand-text">
                <h1>Donate Blockchain</h1>
                <p className="subtitle">Hệ thống Quyên góp Từ thiện Minh bạch</p>
              </div>
            </div>
          </div>
          <WalletConnect
            isConnected={isConnected}
            userAccount={userAccount}
            onConnected={handleWalletConnected}
            onDisconnected={handleWalletDisconnected}
          />
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <span className="hero-badge">Minh bạch · An toàn · Trên Blockchain</span>
          <h2 className="hero-title">
            Mỗi đóng góp là một <span className="grad-text">câu chuyện hy vọng</span>
          </h2>
          <p className="hero-desc">
            Quyên góp trực tiếp bằng ETH thông qua hợp đồng thông minh.
            Mọi giao dịch được ghi nhận công khai và không thể chỉnh sửa trên Ethereum.
          </p>
        </div>
      </section>

      <main className="app-main">
        <div className="container">
          <div className="content-grid">
            <div className="left-column">
              {!isConnected ? (
                <div className="connect-prompt">
                  <div className="connect-icon" aria-hidden="true">🔐</div>
                  <h2>Kết nối ví của bạn</h2>
                  <p>
                    Vui lòng kết nối ví MetaMask để bắt đầu đóng góp và theo dõi
                    giao dịch của bạn trên blockchain.
                  </p>
                  <ul className="connect-tips">
                    <li>Hỗ trợ mạng Sepolia / Ethereum</li>
                    <li>Không lưu trữ thông tin cá nhân</li>
                    <li>Bạn toàn quyền kiểm soát tài sản</li>
                  </ul>
                </div>
              ) : userIsAdmin ? (
                <>
                  <div className="role-switch">
                    <button
                      className={`role-btn ${adminView === "admin" ? "active" : ""}`}
                      onClick={() => setAdminView("admin")}
                    >
                      <span aria-hidden="true">🛡️</span> Bảng quản trị
                    </button>
                    <button
                      className={`role-btn ${adminView === "donate" ? "active" : ""}`}
                      onClick={() => setAdminView("donate")}
                    >
                      <span aria-hidden="true">💝</span> Quyên góp
                    </button>
                  </div>
                  {adminView === "admin" ? (
                    <AdminPanel
                      userAccount={userAccount}
                      onWithdrawSuccess={handleDonationSuccess}
                      onDataChange={handleDonationSuccess}
                    />
                  ) : (
                    <DonationForm
                      userAccount={userAccount}
                      onDonationSuccess={handleDonationSuccess}
                      onContractDataUpdate={updateContractData}
                    />
                  )}
                </>
              ) : (
                <DonationForm
                  userAccount={userAccount}
                  onDonationSuccess={handleDonationSuccess}
                  onContractDataUpdate={updateContractData}
                />
              )}
            </div>

            <div className="right-column">
              <Statistics contractData={contractData} refreshKey={refreshKey} />
              <Leaderboard key={refreshKey} />
            </div>
          </div>

          <PublicHistory refreshKey={refreshKey} />
        </div>
      </main>

      <footer className="app-footer">
        <div className="container footer-inner">
          <p>© 2024 Donate Blockchain · Phát triển với Ethereum &amp; React</p>
          <p className="footer-sub">Made with ♥ for transparent charity</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
