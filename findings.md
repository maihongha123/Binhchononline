# Findings & Decisions: Hệ Thống Bình Chọn Trực Tuyến Blockchain

## Requirements
- Xây dựng hệ thống bình chọn trực tuyến ứng dụng công nghệ Blockchain và Smart Contract (Solidity).
- Phân chia công việc rõ ràng cho 3 thành viên:
  - **Thành viên 1:** Kiến trúc Smart Contract & Blockchain (`contracts/Voting.sol`).
  - **Thành viên 2:** Kết nối Web3, script triển khai & xử lý giao dịch (`scripts/deploy.js`, Web3 layer trong `frontend/app.js`).
  - **Thành viên 3:** Thiết kế giao diện UI/UX & hiển thị dữ liệu (`frontend/index.html`, `frontend/style.css`, DOM layer trong `frontend/app.js`).
  - **Cả nhóm:** Kiểm thử QA (Unit test, Integration test) và bảo vệ đồ án.
- Tính năng cốt lõi:
  - Khởi tạo cuộc bầu cử với tiêu đề.
  - Quản trị viên (Admin): Thêm ứng cử viên, Cấp quyền cử tri theo địa chỉ ví ví, Bắt đầu bỏ phiếu, Kết thúc bỏ phiếu.
  - Cử tri (Voter): Bỏ phiếu cho ứng viên hợp lệ, Mỗi cử tri chỉ được bỏ phiếu đúng 1 lần.
  - Công bố kết quả & tìm người chiến thắng sau khi phiên bầu cử kết thúc.

## Research Findings
- **Smart Contract (`contracts/Voting.sol`):**
  - Đã cài đặt các struct `Candidate` (id, name, voteCount), `Voter` (isRegistered, hasVoted, votedCandidateId).
  - Có enum `WorkflowStatus`: `Registering`, `Voting`, `Ended`.
  - Có các modifiers an toàn: `onlyAdmin`, `checkStatus`.
  - Có 4 events: `CandidateAdded`, `VoterRegistered`, `StatusChanged`, `VoteCasted`.
  - Hàm `getWinner()` hiện chỉ lấy ứng viên đầu tiên duyệt qua nếu có nhiều người cùng điểm cao nhất. Cần xử lý kịch bản hòa phiếu.
- **Môi trường Hardhat & Test (`test/Voting.test.js`):**
  - Chạy `hardhat test` đã pass toàn bộ 12 test cases:
    - 3 test khởi tạo hợp đồng
    - 4 test quản lý ứng viên và cử tri
    - 4 test quy trình bình chọn và chống gian lận
    - 1 test tìm người chiến thắng
  - Cần thêm test cho các trường hợp biên: tên rỗng, địa chỉ ví 0x0, không đủ 2 ứng viên khi startVoting, v.v.
- **Frontend & Web3 (`frontend/`):**
  - Sử dụng Vanilla HTML/CSS/JS + Ethers.js v6 CDN.
  - Đã có khung layout 2 cột: Sidebar Admin + Main Panel danh sách ứng cử viên.
  - Hiện đang dùng hàm trình duyệt `alert()` để thông báo kết quả và lỗi giao dịch. Cần nâng cấp lên UI Modal / Toast Notification để tăng tính chuyên nghiệp.
  - Cần bổ sung cơ chế Event Listener (`votingContract.on`) để tự động làm mới giao diện khi có người vote hoặc khi admin cập nhật trạng thái.

## Technical Decisions
| Quyết định | Lý do & Căn cứ |
| :--- | :--- |
| **Không thêm backend server (Node.js/Express)** | Phù hợp nguyên tắc `/pony-tail` (Senior dev lười, YAGNI): DApp tương tác thẳng với Blockchain Node thông qua Ethers.js và ví MetaMask. Loại bỏ hoàn toàn điểm nghẽn tập trung và bảo trì server. |
| **Vanilla HTML/CSS/JS** | Không cần cài đặt `npm build`, `vite`, `next.js` phức tạp cho frontend; giảng viên và sinh viên chỉ cần mở `index.html` hoặc chạy Live Server là hoạt động ngay lập tức. |
| **Tự động xuất file `contract-config.json`** | Script `deploy.js` sau khi chạy sẽ ghi trực tiếp `address` và `network` vào `frontend/contract-config.json`, giúp frontend tự động nhận diện contract mới nhất mà không phải paste tay. |
| **Xử lý hòa phiếu trong Smart Contract** | Tránh sai lệch khi công bố kết quả bầu cử môn học; nếu có 2 ứng viên cùng số phiếu cao nhất, hệ thống thông báo trạng thái hòa hoặc danh sách đồng hạng nhất. |

## Issues Encountered
| Vấn đề | Hướng giải quyết |
| :--- | :--- |
| Trình duyệt có thể chặn popup thông báo hoặc người dùng khó chịu với `alert()` liên tục | Xây dựng Toast Notification component nhẹ trong CSS/JS, hiển thị trạng thái giao dịch: Đang gửi -> Đang xác thực -> Thành công/Thất bại. |
| MetaMask chưa được chuyển đúng mạng Localhost (Chain ID 31337) | Thêm đoạn mã kiểm tra chainId và tự động yêu cầu ví chuyển mạng sang Localhost 8545 bằng `wallet_switchEthereumChain` / `wallet_addEthereumChain`. |
| Giao diện chưa tự cập nhật khi tài khoản khác vừa bỏ phiếu | Đăng ký bộ lắng nghe sự kiện (`votingContract.on("VoteCasted", ...)`) để kích hoạt `reloadData()` tự động. |

## Resources
- Hợp đồng chính: [contracts/Voting.sol](file:///d:/Blockchain/BINHCHONONLINE/contracts/Voting.sol)
- Kịch bản triển khai: [scripts/deploy.js](file:///d:/Blockchain/BINHCHONONLINE/scripts/deploy.js)
- Giao diện người dùng: [frontend/index.html](file:///d:/Blockchain/BINHCHONONLINE/frontend/index.html)
- Kịch bản Web3 & tương tác: [frontend/app.js](file:///d:/Blockchain/BINHCHONONLINE/frontend/app.js)
- Định kiểu giao diện: [frontend/style.css](file:///d:/Blockchain/BINHCHONONLINE/frontend/style.css)
- Bộ kiểm thử tự động: [test/Voting.test.js](file:///d:/Blockchain/BINHCHONONLINE/test/Voting.test.js)
- Thư viện Ethers.js v6 documentation: https://docs.ethers.org/v6/
- Hardhat documentation: https://hardhat.org/docs
