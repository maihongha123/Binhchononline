# Kế Hoạch Dự Án: Hệ Thống Bình Chọn Trực Tuyến Blockchain (BINHCHONONLINE)

## Goal
Xây dựng, hoàn thiện, kiểm thử và đóng gói toàn diện hệ thống DApp bình chọn trực tuyến trên nền tảng Blockchain Ethereum/Solidity với giao diện Web3 trực quan, phục vụ báo cáo và bảo vệ đồ án môn học đạt kết quả cao nhất.

## Current Phase
Phase 1: Requirements & Codebase Audit (Hoàn thành khảo sát & lập kế hoạch tổng thể)

## Phases

### Phase 1: Requirements & Codebase Audit (Khảo sát hiện trạng & Kiểm toán mã nguồn)
- [x] Đọc và đối chiếu cấu trúc kỹ năng `.agents` (`planning-with-files`, `ponytail`, `caveman`, `using-agent-skills`)
- [x] Khảo sát toàn bộ repository: `contracts/Voting.sol`, `scripts/deploy.js`, `frontend/`, `test/Voting.test.js`
- [x] Xác định hiện trạng: Smart contract đã có logic cơ bản, 12 unit test đang pass, frontend đã có khung Ethers.js v6
- [x] Lập 3 tệp quản lý ngữ cảnh: `task_plan.md`, `findings.md`, `progress.md`
- **Status:** complete

### Phase 2: Smart Contract Hardening & Edge Cases (Gia cố Hợp đồng thông minh)
- [ ] Rà soát logic hòa phiếu trong `getWinner()` (xử lý khi có nhiều ứng viên cùng số phiếu cao nhất)
- [ ] Bổ sung kiểm tra dữ liệu đầu vào: chuỗi rỗng, địa chỉ ví cử tri trùng lặp, giới hạn số lượng ứng viên hợp lý
- [ ] Kiểm tra kiểm soát quyền truy cập (`onlyAdmin`, trạng thái `WorkflowStatus`) đảm bảo không thể bypass
- [ ] Bổ sung các event chi tiết hỗ trợ đồng bộ thời gian thực cho Frontend
- [ ] Tối ưu chi phí Gas (sử dụng calldata, packing biến hợp lý nếu cần)
- **Status: pending

### Phase 3: Comprehensive Testing & Security Verification (Kiểm thử tự động & Bảo mật)
- [ ] Mở rộng bộ Unit Test từ 12 lên 20+ test cases bao phủ toàn bộ các edge cases
- [ ] Viết test cho kịch bản hòa phiếu, đăng ký cử tri hàng loạt, chuyển đổi sai trạng thái
- [ ] Viết test mô phỏng tấn công: cử tri cố tình gọi hàm admin, cử tri bỏ phiếu 2 lần, gọi vote khi chưa mở
- [ ] Đo lường độ bao phủ mã nguồn (Coverage report với `solidity-coverage` nếu cần)
- **Status:** pending

### Phase 4: Web3 Middleware & Automated Deployment (Hoàn thiện kết nối Web3 & Tự động hóa)
- [ ] Chuẩn hóa `scripts/deploy.js`: tự động xuất file ABI đầy đủ và địa chỉ sang `frontend/contract-config.json`
- [ ] Thêm cấu hình mạng local (Hardhat Node: 127.0.0.1:8545) và testnet (Sepolia/Amoy) trong `hardhat.config.js`
- [ ] Cải thiện xử lý tài khoản trong `frontend/app.js`: bắt sự kiện đổi tài khoản `accountsChanged`, đổi mạng `chainChanged`
- [ ] Lắng nghe sự kiện On-Chain thời gian thực (`votingContract.on("VoteCasted", ...)`), tự động reload dữ liệu không cần F5
- **Status:** pending

### Phase 5: Modern UI/UX Enhancement (Nâng cấp Giao diện & Trải nghiệm Người dùng)
- [ ] Thay thế hoàn toàn các hàm `alert()` bằng hệ thống Toast Notification / Modal thông báo hiện đại
- [ ] Bổ sung thanh tiến độ phần trăm phiếu bầu cho từng ứng cử viên (Vote Percentage Bar)
- [ ] Hiển thị trực quan trạng thái ví cử tri: Đã đăng ký hay chưa, Đã vote hay chưa, Đang ở vòng nào
- [ ] Thiết kế bảng vinh danh người thắng cuộc (Winner Podium / Spotlight) khi trạng thái là `Ended`
- [ ] Tối ưu hiển thị responsive trên thiết bị di động và máy tính bảng
- **Status:** pending

### Phase 6: System Integration & End-to-End Simulation (Tích hợp Hệ thống & Mô phỏng E2E)
- [ ] Thiết lập kịch bản demo mẫu: Tạo cuộc bầu cử -> Thêm 3 ứng viên -> Đăng ký 3 cử tri -> Mở bình chọn -> Vote -> Đóng bầu cử -> Xem kết quả
- [ ] Viết script `scripts/seed.js` để tự động khởi tạo dữ liệu mẫu cho việc thuyết trình không bị mất thời gian
- [ ] Kiểm thử E2E trên trình duyệt với MetaMask (kiểm tra từ chối ký, sai số gas, sai mạng)
- **Status:** pending

### Phase 7: Project Documentation & Presentation Prep (Tài liệu hóa, Báo cáo & Thuyết trình)
- [ ] Cập nhật toàn diện `README.md` với hướng dẫn cài đặt từng bước, sơ đồ kiến trúc hệ thống
- [ ] Soạn thảo khung Báo cáo Đồ án chi tiết (Word / Markdown) gồm lý thuyết Blockchain, thiết kế Smart Contract, kết quả thử nghiệm
- [ ] Chuẩn bị kịch bản thuyết trình và slide demo cho 3 thành viên theo đúng phân công nhiệm vụ
- **Status:** pending

## Key Questions
1. *Smart contract có cần hỗ trợ nhiều cuộc bầu cử đồng thời hay một phiên bầu cử độc lập theo hợp đồng?*
   - Giải pháp: Giữ kiến trúc đơn phiên (1 contract = 1 kỳ bầu cử) theo nguyên lý YAGNI (`ponytail`), tối giản, minh bạch và dễ triển khai.
2. *Làm thế nào xử lý trường hợp hai ứng viên có số phiếu hòa nhau khi kết thúc?*
   - Cần cập nhật hàm `getWinner()` hoặc cung cấp `getWinners()` để trả về danh sách nếu hòa, tránh công bố sai lệch.
3. *Người dùng có bắt buộc cài MetaMask không?*
   - Có, DApp sử dụng Ethers.js BrowserProvider gắn kết với MetaMask để ký giao dịch phi tập trung.

## Decisions Made
| Quyết định | Lý do & Căn cứ |
| :--- | :--- |
| Giữ nguyên kiến trúc DApp thuần không Backend server | Tránh over-engineering theo `/pony-tail`. Mọi dữ liệu nằm on-chain, giao tiếp trực tiếp qua RPC/MetaMask. |
| Sử dụng Ethers.js v6 CDN cho frontend | Giảm phụ thuộc bundler (Webpack/Vite), chạy trực tiếp với Live Server, sinh viên dễ nộp bài và demo. |
| Dùng `contract-config.json` kết nối giữa Deploy script và Frontend | Đảm bảo Thành viên 2 và Thành viên 3 không cần hardcode địa chỉ ví hay can thiệp thủ công. |
| Tách biệt rõ ràng 3 vai trò trong nhóm | Phù hợp yêu cầu phân công nhiệm vụ trong `README.md` cho buổi bảo vệ đồ án. |

## Errors Encountered
| Lỗi / Vấn đề | Lần thử | Cách xử lý |
| :--- | :--- | :--- |
| `alert()` trình duyệt chặn luồng thao tác và kém chuyên nghiệp | 1 | Lên kế hoạch thay bằng Toast UI component thuần CSS/JS trong Phase 5 |
| `getWinner()` chỉ lấy ứng viên đầu tiên nếu có 2 người bằng phiếu | 1 | Ghi nhận vào Phase 2 để bổ sung kiểm tra hòa phiếu |

## Notes
- Luôn kiểm tra lại kế hoạch trước khi bắt đầu từng Phase.
- Cập nhật `progress.md` sau mỗi thay đổi mã nguồn.
- Ghi nhận mọi lỗi phát sinh vào bảng Errors.
