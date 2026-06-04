<!-- Use this file to provide workspace-specific custom instructions to Copilot. -->

# Donate Blockchain - Development Instructions

This is a transparent charity donation system using Ethereum blockchain.

## Project Overview

- **Smart Contract**: Solidity (CharityDonation.sol)
- **Framework**: Hardhat for development
- **Frontend**: React + ethers.js
- **Network**: Sepolia Testnet
- **Language**: JavaScript/Solidity

## Key Commands

```bash
npm run compile          # Compile smart contracts
npm run test             # Run smart contract tests
npm run deploy:sepolia   # Deploy to Sepolia testnet
npm run frontend         # Start React development server
npm run install:all      # Install all dependencies
```

## Project Structure

```
contracts/              # Solidity smart contracts
frontend/              # React frontend application
scripts/              # Deployment scripts
test/                # Smart contract tests
hardhat.config.js    # Hardhat configuration
package.json         # Root dependencies
.env.example        # Environment template
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm run install:all
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Compile Contract**
   ```bash
   npm run compile
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

5. **Deploy to Testnet**
   ```bash
   npm run deploy:sepolia
   ```

6. **Configure Frontend**
   - Copy contract address from deployment
   - Update `frontend/.env` with `REACT_APP_CONTRACT_ADDRESS`

7. **Start Frontend**
   ```bash
   npm run frontend
   ```

## Smart Contract Functions

### Core Functions
- `donate()` - Accept ETH donations
- `getLeaderboard(limit)` - Get top donors
- `getDonationAmount(address)` - Check donor total
- `getDonorStats(address)` - Get donor details

### Admin Functions
- `updateMainWallet(address)` - Change receiving wallet
- `updateCampaignName(string)` - Update campaign name

## Frontend Components

- `WalletConnect` - MetaMask connection
- `DonationForm` - Donation interface
- `Leaderboard` - Top donors display
- `Statistics` - Campaign statistics

## Important Notes

- ⚠️ Never commit `.env` files
- Test on Sepolia before mainnet
- Get testnet ETH from faucet: https://www.sepoliafaucet.io/
- Use Infura for RPC: https://www.infura.io/
- View deployments on Etherscan: https://sepolia.etherscan.io/

## Useful Links

- 📖 [README.md](README.md) - Full documentation
- 🚀 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Step-by-step setup
- 🔗 [Hardhat Docs](https://hardhat.org/)
- 🌐 [Ethers.js Docs](https://docs.ethers.org/)
- ⛓️ [Solidity Docs](https://docs.soliditylang.org/)

## Common Tasks

### View Contract on Etherscan
After deployment, view at: `https://sepolia.etherscan.io/address/CONTRACT_ADDRESS`

### Get More Testnet ETH
1. Visit https://www.sepoliafaucet.io/
2. Enter wallet address
3. Receive test ETH

### Debug Issues
- Check `.env` configuration
- Verify network is Sepolia in MetaMask
- Check account has sufficient gas
- View deployment logs

## Assistance

Copilot can help with:
- Code implementation and debugging
- Solidity smart contract development
- React component creation
- Blockchain integration
- Smart contract testing
- Deployment assistance

Ask Copilot for help with any development tasks!
