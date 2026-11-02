# ĐỒ ÁN MÔN HỌC: HỆ THỐNG BÌNH CHỌN TRỰC TUYẾN TRÊN BLOCKCHAIN (ONLINE VOTING DAPP)

> **Môn học:** Blockchain cơ bản / Phát triển ứng dụng phân tán  
> **Nền tảng:** Ethereum / Solidity / Hardhat / Ethers.js v6 / Web3 Frontend  

---

## 📌 1. TỔNG QUAN ĐỒ ÁN

Hệ thống Bình chọn Trực tuyến (Online Voting DApp) là ứng dụng phi tập trung được xây dựng trên nền tảng Blockchain Ethereum. Dự án giải quyết các vấn đề cố hữu của hệ thống bỏ phiếu truyền thống: thiếu minh bạch, nguy cơ thao túng cơ sở dữ liệu và gian lận kiểm phiếu.

### 🌟 Ưu điểm cốt lõi của giải pháp Blockchain
- **Minh bạch & Bất biến (Immutability):** Mọi phiếu bầu được ghi nhận trực tiếp lên sổ cái Blockchain dưới dạng giao dịch đã ký số, không thể bị xóa, sửa đổi hoặc làm giả.
- **Chống gian lận (Anti-Fraud):** Mỗi cử tri chỉ được cấp quyền bởi Quản trị viên và chỉ có thể thực hiện bỏ phiếu đúng **1 lần duy nhất** (kiểm soát bằng Smart Contract).
- **Kiểm phiếu tự động & Công bằng:** Kết quả được tính toán và công bố trực tiếp thông qua thuật toán trong Smart Contract ngay khi kết thúc bầu cử mà không phụ thuộc vào bên thứ ba.

---

## 🏗️ 2. KIẾN TRÚC HỆ THỐNG & CÔNG NGHỆ

Hệ thống hoạt động theo mô hình DApp 3 tầng thuần phi tập trung (không cần backend server trung gian):

```
+-------------------------------------------------------------------+
|               GIAO DIỆN NGƯỜI DÙNG (FRONTEND)                     |
|  - HTML5 / CSS3 (Giao diện Dark Mode & Glassmorphism)             |
|  - Vanilla JavaScript (Xử lý DOM, hiển thị trạng thái)            |
+---------------------------------+---------------------------------+
                                  |
                   Ethers.js v6 & MetaMask Wallet
                                  |
                                  v
+-------------------------------------------------------------------+
|              TẦNG KẾT NỐI WEB3 & TRUYỀN NHẬN GIAO DỊCH            |
|  - JSON-RPC Provider (Hardhat Local Node: http://127.0.0.1:8545)  |
|  - Tự động nạp ABI & Contract Address qua contract-config.json   |
+---------------------------------+---------------------------------+
                                  |
                      JSON-RPC / EVM Bytecode
                                  |
                                  v
+-------------------------------------------------------------------+
|               SMART CONTRACT TẦNG BLOCKCHAIN                      |
|  - Ngôn ngữ: Solidity (contracts/Voting.sol)                      |
|  - Quản lý trạng thái: Registering -> Voting -> Ended             |
|  - Kiểm soát phân quyền: onlyAdmin, checkStatus                   |
+-------------------------------------------------------------------+
```

### 🛠️ Ngăn xếp công nghệ (Tech Stack)
| Thành phần | Công nghệ sử dụng | Mục đích |
| :--- | :--- | :--- |
| **Smart Contract** | Solidity (`^0.8.0`) | Thực thi logic nghiệp vụ, lưu trữ phiếu bầu và tính toán người thắng cuộc |
| **Blockchain Framework** | Hardhat (`v2.29.1`) | Môi trường biên dịch, kiểm thử tự động và giả lập Local Blockchain Node |
| **Web3 Client** | Ethers.js (`v6.7.0`) | Kết nối ví MetaMask, ký giao dịch và đọc dữ liệu on-chain |
| **Frontend UI** | HTML5, CSS3, Vanilla JS | Giao diện thân thiện người dùng, hỗ trợ Admin Dashboard và Voter Area |

---

## 🔄 3. QUY TRÌNH HOẠT ĐỘNG (WORKFLOW)

Cuộc bầu cử trải qua 3 giai đoạn quản lý nghiêm ngặt thông qua máy trạng thái (`enum WorkflowStatus`):

```
       [Khởi tạo]
           │
           ▼
┌─────────────────────────┐
│   0. Registering        │ ──► Admin thêm danh sách ứng cử viên (tối thiểu 2 ứng viên)
│   (Giai đoạn đăng ký)   │ ──► Admin cấp quyền bỏ phiếu cho các địa chỉ ví cử tri
└──────────┬──────────────┘
           │ (Admin gọi startVoting())
           ▼
┌─────────────────────────┐
│   1. Voting             │ ──► Cử tri đã đăng ký kết nối MetaMask để bỏ phiếu
│   (Đang mở bình chọn)   │ ──► Chặn bỏ phiếu lần 2; Chặn ví không có trong danh sách
└──────────┬──────────────┘
           │ (Admin gọi endVoting())
           ▼
┌─────────────────────────┐
│   2. Ended              │ ──► Hòm phiếu đóng, ngừng nhận giao dịch bỏ phiếu
│   (Đã kết thúc)         │ ──► Tự động xác định và vinh danh ứng cử viên thắng cuộc
└─────────────────────────┘
```

---

## 👥 4. PHÂN CHIA NHIỆM VỤ NHÓM (3 THÀNH VIÊN)

| Thành viên | Vai trò | Trách nhiệm chính | Tệp phụ trách |
| :--- | :--- | :--- | :--- |
| **Thành viên 1** | **Smart Contract Engineer** | • Thiết kế dữ liệu (`Candidate`, `Voter`), logic máy trạng thái.<br>• Viết hàm thêm ứng viên, cấp quyền cử tri, bỏ phiếu, tìm người thắng.<br>• Cài đặt bảo mật (`onlyAdmin`, kiểm tra giai đoạn). | `contracts/Voting.sol` |
| **Thành viên 2** | **Web3 Middleware Engineer** | • Xây dựng kịch bản triển khai (`scripts/deploy.js`).<br>• Tự động đồng bộ `contract-config.json` sang frontend.<br>• Tích hợp Ethers.js, kết nối MetaMask, ký & gửi giao dịch on-chain. | `scripts/deploy.js`<br>`frontend/app.js` (Web3 logic) |
| **Thành viên 3** | **Frontend UI/UX Engineer** | • Thiết kế giao diện HTML/CSS phong cách hiện đại.<br>• Bố cục Dashboard cho Admin & Danh sách ứng viên cho Cử tri.<br>• Xử lý DOM, hiển thị trạng thái giao dịch và banner vinh danh. | `frontend/index.html`<br>`frontend/style.css`<br>`frontend/app.js` (DOM logic) |
| **Cả nhóm** | **QA & Báo cáo đồ án** | • Viết và chạy bộ Unit Test tự động (Mocha/Chai).<br>• Thử nghiệm tích hợp E2E trên trình duyệt với MetaMask.<br>• Soạn thảo báo cáo đồ án và chuẩn bị slide bảo vệ. | `test/Voting.test.js`<br>Báo cáo & Slide |

---

## 📂 5. CẤU TRÚC THƯ MỤC

```text
BINHCHONONLINE/
├── contracts/
│   └── Voting.sol             # Hợp đồng thông minh bình chọn (Solidity)
├── scripts/
│   └── deploy.js              # Kịch bản biên dịch & triển khai lên Blockchain
├── test/
│   └── Voting.test.js         # Bộ kiểm thử tự động (24 Unit Test cases toàn diện)
├── frontend/
│   ├── index.html             # Giao diện chính của ứng dụng
│   ├── style.css              # Định dạng giao diện Dark Mode / Card UI
│   ├── app.js                 # Logic kết nối Web3, MetaMask và tương tác DOM
│   └── contract-config.json   # Cấu hình địa chỉ contract sau khi deploy (tự sinh)
├── hardhat.config.js          # Cấu hình môi trường mạng và trình biên dịch Solidity
├── package.json               # Danh sách thư viện và scripts npm
├── task_plan.md               # Kế hoạch phát triển chi tiết dự án (7 giai đoạn)
├── findings.md                # Ghi nhận phân tích kỹ thuật và quyết định kiến trúc
├── progress.md                # Nhật ký tiến độ thực thi dự án
└── README.md                  # Tài liệu giới thiệu tổng quan đồ án
```

---

## 🚀 6. HƯỚNG DẪN CÀI ĐẶT & CHẠY THỬ NGHIỆM

### Bước 1: Cài đặt thư viện phụ thuộc
Yêu cầu máy tính đã cài đặt [Node.js](https://nodejs.org/) (khuyến nghị phiên bản LTS v18 trở lên).

```bash
npm install
```

### Bước 2: Biên dịch Hợp đồng thông minh
```bash
npx hardhat compile
```

### Bước 3: Chạy bộ kiểm thử tự động (Unit Test)
```bash
npx hardhat test
```
*(Kết quả mong đợi: 24/24 passing test cases chứng minh logic Smart Contract vận hành chính xác 100%).*

### Bước 4: Khởi chạy mạng Blockchain cục bộ & Triển khai
Mở **Terminal 1** để chạy mạng giả lập Hardhat:
```bash
npx hardhat node
```
*(Terminal sẽ hiển thị 20 tài khoản ví thử nghiệm kèm 10,000 ETH giả lập).*

Mở **Terminal 2** để thực hiện triển khai hợp đồng:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
*(Script sẽ tự động ghi địa chỉ hợp đồng vào file `frontend/contract-config.json`).*

### Bước 5: Trải nghiệm trên Giao diện Web
1. Khởi chạy `frontend/index.html` bằng **Live Server** (tiện ích mở rộng trên VS Code) hoặc mở trực tiếp trên trình duyệt.
2. Thêm mạng **Hardhat Localhost** vào ví MetaMask:
   - **Network Name:** Hardhat Local
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
3. Nhập (Import) Private Key của `Account #0` (Admin) và `Account #1`, `Account #2` (Cử tri) từ Terminal 1 vào MetaMask để tiến hành thử nghiệm toàn bộ quy trình bình chọn.

---

## 📖 7. TÀI LIỆU GIẢI THÍCH MÃ NGUỒN (DÀNH CHO BẢO VỆ ĐỒ ÁN)

- **Dành cho Thành viên 1 (Smart Contract Engineer):** Đã biên soạn cẩm nang chi tiết tại [README_SMART_CONTRACT.md](file:///d:/Nam4_HK1/IOT/ThucHanh/Binhchononline/README_SMART_CONTRACT.md) giải thích cặn kẽ 7 cụm logic của `contracts/Voting.sol` cùng các câu hỏi phản biện mẫu thường gặp của hội đồng chấm thi.

