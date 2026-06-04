# Donate Blockchain — Backend API

Backend nhỏ gọn dùng **Express + SQLite (`node:sqlite` built-in)** để lưu trữ tập trung:

- Yêu cầu rút tiền (`/api/requests`)
- Lịch sử rút tiền (`/api/withdrawals`)
- Minh chứng sử dụng tiền (`/api/proofs`) — kèm upload ảnh

Tất cả API ghi (POST / PATCH / DELETE) đều yêu cầu **chữ ký từ ví admin** đã cấu hình. Backend dùng `ethers.verifyMessage` để xác minh, không tin tưởng địa chỉ ví trong header.

## Cài đặt

> Yêu cầu Node.js ≥ **22.5** (cần module `node:sqlite` built-in).
> Không cần native compile, không cần build tools.

```bash
cd backend
yarn install        # hoặc npm install
cp .env.example .env   # rồi sửa ADMIN_WALLET nếu cần
yarn start             # hoặc yarn dev (nodemon)
```

Script `start` đã tự thêm flag `--experimental-sqlite` cho phía Node v22.x.
Trên Node v24+ flag này được bỏ qua.

API mặc định chạy ở `http://localhost:4000`. Dữ liệu lưu tại `backend/data/donate.sqlite`, ảnh tại `backend/uploads/`.

## Endpoints công khai (read-only)

| Method | Path                  | Mô tả                              |
| ------ | --------------------- | ---------------------------------- |
| GET    | `/api/health`         | Kiểm tra trạng thái + số lượng     |
| GET    | `/api/requests`       | Danh sách yêu cầu rút              |
| GET    | `/api/withdrawals`    | Lịch sử rút tiền                   |
| GET    | `/api/proofs`         | Danh sách minh chứng               |
| GET    | `/uploads/<file>`     | Ảnh minh chứng đã upload           |

## Endpoints admin (cần chữ ký)

Header bắt buộc cho mọi request admin:

| Header                | Giá trị                                                    |
| --------------------- | ---------------------------------------------------------- |
| `X-Admin-Address`     | Địa chỉ ví admin (cùng `ADMIN_WALLET`)                     |
| `X-Admin-Issued-At`   | `Date.now()` lúc ký (ms)                                   |
| `X-Admin-Signature`   | Chữ ký EIP-191 của message bên dưới                        |

Message admin ký:

```
DONATE_BLOCKCHAIN_ADMIN_LOGIN:<address-lowercase>:<issuedAt>
```

| Method | Path                       | Mô tả                                          |
| ------ | -------------------------- | ---------------------------------------------- |
| POST   | `/api/admin/auth/login`    | Kiểm tra chữ ký (trả về `expiresAt`)           |
| POST   | `/api/requests`            | Tạo yêu cầu rút                                |
| PATCH  | `/api/requests/:id`        | Cập nhật trạng thái / txHash                   |
| DELETE | `/api/requests/:id`        | Xóa yêu cầu                                    |
| POST   | `/api/withdrawals`         | Ghi nhận lần rút (cần `txHash` thật on-chain)  |
| POST   | `/api/proofs/upload`       | Upload ảnh (multipart, field `image`, ≤5MB)    |
| POST   | `/api/proofs`              | Tạo minh chứng                                 |
| DELETE | `/api/proofs/:id`          | Xóa minh chứng (xóa luôn file ảnh local)       |

## Tại sao dùng chữ ký?

Vì frontend là open-source, ai cũng có thể giả mạo header `X-Admin-Address`. Để chắc chắn người gọi API thực sự sở hữu private key của ví admin, backend yêu cầu chữ ký và dùng `ethers.verifyMessage` để khôi phục địa chỉ ký. Đây là cùng nguyên lý của SIWE (Sign-In With Ethereum).

> **Lưu ý**: Đây là lớp bảo vệ ở backend. Lớp bảo vệ on-chain vẫn là modifier `onlyOwner` trong smart contract — tức là dù có người vượt qua API, họ vẫn không thể gọi `withdraw()` vì chỉ ví owner mới gọi được.
