<h1 align="center">DONATE BLOCKCHAIN
 HỆ THỐNG QUYÊN GÓP MINH BẠCH</h1>

<div align="center">
<p align="center">
  <img src="logoDaiNam.png" alt="DaiNam University Logo" width="200"/>
  <img src="LogoAIoTLab.png" alt="AIoTLab Logo" width="170"/>
</p>
  
[![React](https://img.shields.io/badge/React-blue?style=for-the-badge)](https://react.dev/)
[![Solidity](https://img.shields.io/badge/Solidity-black?style=for-the-badge)](https://docs.soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-purple?style=for-the-badge)](https://hardhat.org/)

</div>

---

## 🌟 Giới thiệu

**Donate Blockchain** là hệ thống quyên góp từ thiện minh bạch, xây dựng trên Ethereum Sepolia Testnet. Dự án kết hợp:

- **Smart contract Solidity** để lưu trữ khoản quyên góp và bảo vệ rút tiền bằng `onlyOwner`
- **Frontend React** để người dùng kết nối MetaMask, gửi ETH và theo dõi bảng xếp hạng
- **Backend Node.js + SQLite** để quản lý yêu cầu rút, lịch sử và minh chứng chi tiêu

---

## 🧩 Kiến trúc 3 lớp

Dự án có **3 thành phần** chạy đồng thời:

| Thành phần          | Vai trò                                                          | Cổng |
| ------------------- | ---------------------------------------------------------------- | ---- |
| **Smart contract**  | Ghi nhận quyên góp, kiểm soát rút tiền bằng `onlyOwner`          | n/a  |
| **Backend**         | Lưu yêu cầu rút, lịch sử rút, minh chứng chi tiêu bằng SQLite    | 4000 |
| **Frontend**        | Giao diện React + MetaMask + gọi API backend                    | 3000 |

### Chạy cùng nhau

```bash
# Terminal 1 — Backend
cd backend
yarn install
yarn start
# → http://localhost:4000

# Terminal 2 — Frontend
cd frontend
yarn install
yarn start
# → http://localhost:3000

# Terminal 3 — Smart contract / deploy
# Xem phần Quick Start hoặc chạy test
```

---

## 🔐 Bảo mật theo lớp

1. **Smart contract `onlyOwner`**: hạn chế rút tiền chỉ cho owner. Dù frontend/backend bị tấn công, hợp đồng vẫn bảo vệ.
2. **Backend xác thực chữ ký**: admin cần ký message bằng MetaMask. Backend dùng `ethers.verifyMessage` để xác minh ví admin.
3. **Frontend ẩn UI admin**: giao diện chỉ hiển thị chức năng admin khi đã xác thực.

---

## 🚀 Tính năng chính

- **Kết nối MetaMask** để quyên góp ETH an toàn
- **Leaderboard** hiển thị top nhà tài trợ
- **Thống kê thời gian thực**: tổng tiền, số lượng nhà tài trợ, khoản quyên góp lớn nhất
- **Backend quản lý yêu cầu rút tiền** và minh chứng chi tiêu
- **Sepolia Testnet** an toàn cho thử nghiệm

---

## 📁 Cấu trúc dự án

```
donate-blockchain/
├── backend/
│   ├── package.json
│   ├── README.md
│   ├── src/
│   │   ├── db.js
│   │   ├── server.js
│   │   ├── middleware/
│   │   │   └── adminAuth.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── proofs.js
│   │       ├── requests.js
│   │       └── withdrawals.js
│   └── uploads/
├── contracts/
│   └── CharityDonation.sol
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js
│       ├── index.js
│       ├── App.css
│       ├── index.css
│       ├── components/
│       │   ├── AdminPanel.js
│       │   ├── DonationForm.js
│       │   ├── Leaderboard.js
│       │   ├── PublicHistory.js
│       │   ├── Statistics.js
│       │   └── WalletConnect.js
│       └── utils/
│           ├── adminAuth.js
│           ├── api.js
│           ├── constants.js
│           └── contractUtils.js
├── scripts/
│   └── deploy.js
├── test/
│   └── CharityDonation.test.js
├── hardhat.config.js
├── package.json
├── .env.example
└── README.md
```

---

## 📌 Hàm hợp đồng chính

### Public functions

- `donate()` - Gửi ETH quyên góp vào hợp đồng
- `getLeaderboard(limit)` - Lấy danh sách nhà tài trợ hàng đầu
- `getDonationAmount(address)` - Lấy tổng tiền người dùng đã quyên góp
- `getDonationCount(address)` - Lấy số lần quyên góp của người dùng
- `getDonorStats(address)` - Lấy chi tiết trạng thái nhà tài trợ
- `isDonor(address)` - Kiểm tra xem địa chỉ có phải nhà tài trợ hay không

### Admin functions

- `updateMainWallet(address)` - Thay đổi ví nhận chính (owner only)
- `updateCampaignName(string)` - Cập nhật tên chiến dịch (owner only)

---

## ⚙️ Công nghệ sử dụng

- **Solidity**: hợp đồng thông minh
- **Hardhat**: môi trường phát triển Ethereum
- **React**: frontend
- **Ethers.js**: kết nối blockchain
- **Node.js + Express**: backend API
- **SQLite**: lưu trữ lịch sử rút tiền và minh chứng

---

## 🧪 Cài đặt và chạy

### 1. Cài dependencies

```bash
npm run install:all
```

### 2. Tạo file cấu hình

```bash
cp .env.example .env
```

Chỉnh sửa `.env` với các giá trị của bạn.

### 3. Biên dịch smart contract

```bash
npm run compile
```

### 4. Chạy test

```bash
npm test
```

---

## 🚀 Triển khai Sepolia

```bash
npm run deploy:sepolia
```

Sau khi deploy thành công, bạn sẽ nhận được:

- Địa chỉ hợp đồng
- Transaction hash
- Hướng dẫn tiếp theo để cấu hình frontend

### Cấu hình frontend

Cập nhật `frontend/.env` với:

```env
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_NETWORK_ID=11155111
REACT_APP_NETWORK_NAME=Sepolia
```

### Khởi động frontend

```bash
npm run frontend
```

Mở `http://localhost:3000`

---

## 🧭 Hướng dẫn sử dụng

1. **Kết nối MetaMask**
   - Nhấn nút "Connect MetaMask"
   - Chấp nhận kết nối trên MetaMask

2. **Quyên góp ETH**
   - Nhập số ETH muốn quyên góp
   - Nhấn "Donate Now"
   - Xác nhận giao dịch trên MetaMask

3. **Xem leaderboard**
   - Theo dõi top nhà tài trợ
   - Xem vị trí của mình
   - Kiểm tra giao dịch trên Etherscan nếu cần

---

## 🔧 Biến môi trường

### Root `.env`

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
MAIN_WALLET_ADDRESS=0x...
```

### Frontend `.env`

```env
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_NETWORK_ID=11155111
REACT_APP_NETWORK_NAME=Sepolia
```

> ⚠️ Không commit file `.env` lên Git

---

## 🛠️ Kiểm tra và gỡ lỗi

### Lỗi kết nối

- **MetaMask không cài**: cài MetaMask
- **Không tìm thấy địa chỉ hợp đồng**: cập nhật `REACT_APP_CONTRACT_ADDRESS`

### Lỗi giao dịch

- **Không đủ ETH**: nạp ETH testnet từ Sepolia faucet
- **Giao dịch thất bại**: kiểm tra gas và số dư

---

## 📣 Ghi chú

- Dự án này dùng để thử nghiệm trên Sepolia, không nên dùng cho mainnet sản phẩm thật
- `onlyOwner` là lớp bảo mật cuối cùng để bảo vệ việc rút tiền
- Backend chỉ lưu trữ dữ liệu phi chuỗi để tăng tính minh bạch và quản lý nghiệp vụ


## Network Configuration

### Sepolia Testnet

- **Network ID**: 11155111
- **RPC URL**: https://sepolia.infura.io/v3/YOUR_KEY
- **Block Explorer**: https://sepolia.etherscan.io
- **Faucet**: https://www.sepoliafaucet.io

## API Reference

### Frontend Components

#### `<DonationForm />`
- Props: `userAccount`, `onDonationSuccess`, `onContractDataUpdate`
- Handles donation amount input and processing

#### `<Leaderboard />`
- Displays top 10 donors
- Auto-refreshes every 10 seconds

#### `<Statistics />`
- Props: `contractData`, `refreshKey`
- Shows total donations, donor count, top donation

#### `<WalletConnect />`
- Props: `isConnected`, `userAccount`, `onConnected`, `onDisconnected`
- Handles MetaMask connection/disconnection

## Security Considerations

⚠️ **Important Security Notes**:

1. **Private Keys**: Never share or commit private keys
2. **Contract Audit**: For production, conduct professional security audit
3. **Testnet Only**: Current deployment is for testing purposes
4. **Gas Limits**: Set appropriate gas limits for transactions
5. **Access Control**: Only owner can update wallet and campaign name

## Gas Estimates

- Deploy contract: ~0.8 ETH
- Donate: ~0.05 ETH + gas
- Get leaderboard: 0 ETH (read-only)

## Future Enhancements

- [ ] Multi-token support (USDT, USDC, etc.)
- [ ] DAO governance
- [ ] Time-locked donations
- [ ] NFT receipts for donors
- [ ] Email notifications
- [ ] Mainnet deployment
- [ ] Withdrawal management

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

- 📧 Email: support@donateblockchain.com
- 💬 Discord: [Join our Discord]
- 🐦 Twitter: [@DonateBlockchain]
- 📖 Docs: [Full Documentation]

## Acknowledgments

- Built with [Hardhat](https://hardhat.org)
- Frontend with [React](https://react.dev)
- Web3 integration via [ethers.js](https://docs.ethers.org)
- Tested with [Chai](https://www.chaijs.com)

---

**Made with ❤️ for transparent charity**
