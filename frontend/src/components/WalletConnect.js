import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./WalletConnect.css";

const NETWORK_LABELS = {
  homestead: "Ethereum",
  mainnet: "Ethereum",
  sepolia: "Sepolia",
  goerli: "Goerli",
  matic: "Polygon",
  "polygon-mumbai": "Mumbai",
  unknown: "Mạng khác",
};

const WalletConnect = ({
  isConnected,
  userAccount,
  onConnected,
  onDisconnected,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [network, setNetwork] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", () => window.location.reload());

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, []);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      onDisconnected();
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("Chưa cài đặt MetaMask. Vui lòng cài đặt trước khi tiếp tục.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);

      if (accounts.length > 0) {
        const net = await provider.getNetwork();
        setNetwork(net.name);
        onConnected(accounts[0]);
      }
    } catch (err) {
      console.error("Connection error:", err);
      setError(err.message || "Không thể kết nối ví. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setNetwork(null);
    onDisconnected();
  };

  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const networkLabel = network
    ? NETWORK_LABELS[network] || network
    : "Đang kết nối";

  return (
    <div className="wallet-connect">
      {!isConnected ? (
        <button
          className="btn btn-primary btn-wallet"
          onClick={connectWallet}
          disabled={isLoading}
        >
          <span className="btn-icon" aria-hidden="true">🦊</span>
          {isLoading ? "Đang kết nối..." : "Kết nối MetaMask"}
        </button>
      ) : (
        <div className="wallet-info">
          <div className="wallet-details">
            <span className="network-badge">
              <span className="dot" /> {networkLabel}
            </span>
            <span className="account-address mono">
              {formatAddress(userAccount)}
            </span>
          </div>
          <button className="btn btn-secondary" onClick={disconnectWallet}>
            Ngắt kết nối
          </button>
        </div>
      )}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default WalletConnect;
