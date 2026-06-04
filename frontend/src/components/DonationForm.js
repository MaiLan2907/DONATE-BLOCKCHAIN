import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getContractInstance, CONTRACT_ABI } from "../utils/contractUtils";
import "./DonationForm.css";

const DonationForm = ({ userAccount, onDonationSuccess, onContractDataUpdate }) => {
  const [donationAmount, setDonationAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [txHash, setTxHash] = useState(null);

  useEffect(() => {
    loadContractData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadContractData = async () => {
    try {
      const contract = await getContractInstance();
      if (contract) {
        const total = await contract.totalDonations();
        const donorCount = await contract.getUniqueDonorsCount();
        const campaignName = await contract.campaignName();

        onContractDataUpdate({
          totalDonations: ethers.formatEther(total),
          donorCount: donorCount.toString(),
          campaignName: campaignName,
        });
      }
    } catch (err) {
      console.error("Error loading contract data:", err);
    }
  };

  const handleDonate = async (e) => {
    e.preventDefault();

    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      setError("Vui lòng nhập số tiền quyên góp hợp lệ.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      setTxHash(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

      if (!contractAddress) {
        throw new Error("Chưa cấu hình địa chỉ hợp đồng thông minh.");
      }

      const contract = new ethers.Contract(
        contractAddress,
        CONTRACT_ABI,
        signer
      );

      const amountInWei = ethers.parseEther(donationAmount);

      const tx = await contract.donate({ value: amountInWei });

      setSuccess("Đã gửi giao dịch! Đang chờ xác nhận trên blockchain...");
      const receipt = await tx.wait();

      if (receipt) {
        setTxHash(receipt.hash);
        setSuccess("Quyên góp thành công! Cảm ơn tấm lòng của bạn.");
        setDonationAmount("");

        await loadContractData();
        onDonationSuccess();

        setTimeout(() => setSuccess(null), 6000);
      }
    } catch (err) {
      console.error("Donation error:", err);
      const message =
        err?.shortMessage || err?.reason || err?.message || "Quyên góp thất bại.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const presets = [0.01, 0.05, 0.1, 0.5, 1.0];

  return (
    <div className="donation-form">
      <div className="form-header">
        <div className="form-title">
          <span className="form-emoji" aria-hidden="true">💝</span>
          <div>
            <h2>Thực hiện quyên góp</h2>
            <p className="form-sub">
              Hỗ trợ chiến dịch bằng ETH — giao dịch được ghi vĩnh viễn trên blockchain.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleDonate}>
        <div className="form-group">
          <label htmlFor="amount">Số tiền quyên góp (ETH)</label>
          <div className="input-group">
            <input
              type="number"
              id="amount"
              placeholder="0.1"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              step="0.000001"
              min="0"
              disabled={isLoading}
            />
            <span className="currency">ETH</span>
          </div>
        </div>

        <div className="preset-amounts">
          <p>Chọn nhanh số tiền:</p>
          <div className="preset-buttons">
            {presets.map((amount) => (
              <button
                key={amount}
                type="button"
                className={`preset-btn ${
                  donationAmount === amount.toString() ? "active" : ""
                }`}
                onClick={() => setDonationAmount(amount.toString())}
                disabled={isLoading}
              >
                {amount} ETH
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-large"
          disabled={isLoading || !donationAmount}
        >
          {isLoading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Đang xử lý...
            </>
          ) : (
            <>Quyên góp ngay</>
          )}
        </button>
      </form>

      {error && (
        <div className="alert alert-error">
          <strong>Có lỗi xảy ra:</strong> {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <p>{success}</p>
          {txHash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-link"
            >
              Xem giao dịch trên Etherscan ↗
            </a>
          )}
        </div>
      )}

      <div className="donation-info">
        <h3>Cách thức hoạt động</h3>
        <ol>
          <li>Nhập số tiền ETH bạn muốn quyên góp.</li>
          <li>Nhấn "Quyên góp ngay" và xác nhận trong ví MetaMask.</li>
          <li>Giao dịch được ghi nhận công khai trên blockchain.</li>
          <li>Theo dõi vị trí của bạn trên bảng xếp hạng nhà hảo tâm!</li>
        </ol>
      </div>
    </div>
  );
};

export default DonationForm;
