import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getContractInstance } from "../utils/contractUtils";
import "./Statistics.css";

const Statistics = ({ contractData, refreshKey }) => {
  const [stats, setStats] = useState({
    totalDonations: "0",
    donorCount: 0,
    campaignName: "Hệ thống Quyên góp Từ thiện Minh bạch",
    topDonation: "0",
  });

  useEffect(() => {
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const loadStatistics = async () => {
    try {
      const contract = await getContractInstance();
      if (contract) {
        const total = await contract.totalDonations();
        const donorCount = await contract.getUniqueDonorsCount();
        const campaignName = await contract.campaignName();

        let topDonation = "0";
        try {
          const [, amounts] = await contract.getLeaderboard(1);
          if (amounts.length > 0) {
            topDonation = ethers.formatEther(amounts[0]);
          }
        } catch (err) {
          console.log("Error getting top donation:", err);
        }

        setStats({
          totalDonations: ethers.formatEther(total),
          donorCount: donorCount.toString(),
          campaignName: campaignName,
          topDonation: topDonation,
        });
      }
    } catch (err) {
      console.error("Error loading statistics:", err);
    }
  };

  const cards = [
    {
      icon: "💰",
      label: "Tổng số tiền quyên góp",
      value: `${parseFloat(stats.totalDonations).toFixed(4)} ETH`,
      tone: "tone-primary",
    },
    {
      icon: "👥",
      label: "Số nhà hảo tâm",
      value: stats.donorCount,
      tone: "tone-success",
    },
    {
      icon: "🏅",
      label: "Quyên góp lớn nhất",
      value: `${parseFloat(stats.topDonation).toFixed(4)} ETH`,
      tone: "tone-warning",
    },
    {
      icon: "🎯",
      label: "Tên chiến dịch",
      value: stats.campaignName,
      tone: "tone-accent",
      isCampaign: true,
    },
  ];

  return (
    <div className="statistics-wrapper">
      <div className="section-header">
        <h2>Thống kê chiến dịch</h2>
        <span className="section-subtitle">Dữ liệu trực tiếp từ blockchain</span>
      </div>
      <div className="statistics">
        {cards.map((card, idx) => (
          <div key={idx} className={`stat-card ${card.tone}`}>
            <div className="stat-icon" aria-hidden="true">{card.icon}</div>
            <div className="stat-content">
              <p className="stat-label">{card.label}</p>
              <p className={`stat-value ${card.isCampaign ? "campaign-name" : ""}`}>
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Statistics;
