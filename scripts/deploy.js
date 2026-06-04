require("dotenv").config();

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying CharityDonation contract...\n");

  // Get main wallet address
  const mainWalletAddress = process.env.MAIN_WALLET_ADDRESS;
  if (!mainWalletAddress) {
    throw new Error("MAIN_WALLET_ADDRESS not set in .env file");
  }

  // Campaign name
  const campaignName = "Transparent Charity Donation System";

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("📧 Deploying with account:", deployerAddress);

  // Get balance - ethers v6
  const balance = await hre.ethers.provider.getBalance(deployerAddress);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy contract
  const CharityDonation = await hre.ethers.getContractFactory("CharityDonation");

  console.log("📝 Contract parameters:");
  console.log("   - Main Wallet:", mainWalletAddress);
  console.log("   - Campaign Name:", campaignName);
  console.log("");

  const charityDonation = await CharityDonation.deploy(
    mainWalletAddress,
    campaignName
  );

  await charityDonation.waitForDeployment();

  const contractAddress = await charityDonation.getAddress();

  console.log("✅ Contract deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("");

  // Save deployment info
  const network = await hre.ethers.provider.getNetwork();

  const deploymentInfo = {
    contractAddress: contractAddress,
    mainWallet: mainWalletAddress,
    deployer: deployerAddress,
    campaignName: campaignName,
    network: hre.network.name,
    deploymentDate: new Date().toISOString(),
    chainId: network.chainId.toString(),
  };

  const deploymentPath = path.join(__dirname, "../deployment_info.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("💾 Deployment info saved to:", deploymentPath);
  console.log("");

  // Print setup instructions
  console.log("🎯 Next steps:");
  console.log(`   1. Copy the contract address: ${contractAddress}`);
  console.log("   2. Update REACT_APP_CONTRACT_ADDRESS in frontend/.env");
  console.log("   3. Update CONTRACT_ADDRESS in .env");
  console.log("   4. Run: cd frontend && npm start");
  console.log("");

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });