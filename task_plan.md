# Kế Hoạch Dự Án: Hệ Thống Bình Chọn Trực Tuyến Blockchain (BINHCHONONLINE)

## Goal
Xây dựng, hoàn thiện, kiểm thử và đóng gói toàn diện hệ thống DApp bình chọn trực tuyến trên nền tảng Blockchain Ethereum/Solidity với giao diện Web3 trực quan, phục vụ báo cáo và bảo vệ đồ án môn học đạt kết quả cao nhất.

## Current Phase
Phase 5: Modern UI/UX Enhancement (Hoàn thành Phase 5 của Thành viên 3 - Sẵn sàng cho Phase 6 & Phase 7)

## Phases

### Phase 1: Requirements & Codebase Audit (Khảo sát hiện trạng & Kiểm toán mã nguồn)
- [x] Đọc và đối chiếu cấu trúc kỹ năng `.agents` (`planning-with-files`, `ponytail`, `caveman`, `using-agent-skills`)
- [x] Khảo sát toàn bộ repository: `contracts/Voting.sol`, `scripts/deploy.js`, `frontend/`, `test/Voting.test.js`
- [x] Xác định hiện trạng: Smart contract đã có logic cơ bản, 12 unit test đang pass, frontend đã có khung Ethers.js v6
- [x] Lập 3 tệp quản lý ngữ cảnh: `task_plan.md`, `findings.md`, `progress.md`
- **Status:** complete

### Phase 2: Smart Contract Hardening & Edge Cases (Gia cố Hợp đồng thông minh)
- [x] Tinh giản logic Smart Contract rõ ràng, tường minh, không nén code khó đọc
- [x] Rà soát và chuẩn hóa kiểm tra dữ liệu đầu vào: chuỗi rỗng, địa chỉ ví trùng lặp
- [x] Đảm bảo kiểm soát quyền truy cập (`onlyAdmin`, `WorkflowStatus`) an toàn
- [x] Giữ đầy đủ các Events hỗ trợ Web3 Frontend
- [x] **Thành viên 2:** Đối chiếu và đồng bộ ABI mới (bổ sung getCandidatesCount & 4 Events thời gian thực) vào frontend/app.js
- **Status:** complete

### Phase 3: Comprehensive Testing & Security Verification (Kiểm thử tự động & Bảo mật)
- [x] Mở rộng bộ Unit Test từ 12 lên 24 test cases bao phủ toàn bộ các edge cases
- [x] Viết test cho kiểm soát máy trạng thái, kiểm tra dữ liệu đầu vào (chuỗi rỗng, địa chỉ ví 0x0)
- [x] Viết test mô phỏng tấn công: cử tri cố tình gọi hàm admin, cử tri bỏ phiếu 2 lần, gọi vote khi chưa mở, gọi vote sau khi đóng
- [x] Kiểm tra phát sự kiện thời gian thực (Events: CandidateAdded, VoteCasted, StatusChanged)
- [x] **Thành viên 2:** Mở rộng lên 27 test cases - Viết kịch bản kiểm thử luồng đa tài khoản ví hoạt động đồng thời bằng `ethers.getSigners()` (Độc lập trạng thái giữa các ví, tính toán số phiếu chính xác)
- **Status:** complete

### Phase 4: Web3 Middleware & Automated Deployment (Hoàn thiện kết nối Web3 & Tự động hóa - Thành viên 2)
- [x] Chuẩn hóa `scripts/deploy.js`: tự động xuất file ABI đầy đủ, ChainId và địa chỉ sang `frontend/contract-config.json`
- [x] Thêm cấu hình mạng local (Hardhat Node: 127.0.0.1:8545, ChainId: 31337) trong `hardhat.config.js`
- [x] Cải thiện xử lý tài khoản trong `frontend/app.js`: tự động kiểm tra & yêu cầu MetaMask đổi sang mạng Localhost, bắt sự kiện `accountsChanged`, `chainChanged`
- [x] Lắng nghe sự kiện On-Chain thời gian thực (`VoteCasted`, `CandidateAdded`, `VoterRegistered`, `StatusChanged`), tự động reload dữ liệu không cần F5
- **Status:** complete

### Phase 5: Modern UI/UX Enhancement (Nâng cấp Giao diện & Trải nghiệm Người dùng - Thành viên 3)
- [x] Thay thế hoàn toàn các hàm `alert()` bằng hệ thống Toast Notification / Modal thông báo hiện đại (5 trạng thái: success, error, warning, info, loading)
- [x] Bổ sung thanh tiến độ phần trăm phiếu bầu cho từng ứng cử viên (Vote Percentage Bar) kèm highlight ứng cử viên dẫn đầu
- [x] Bổ sung Thẻ Hồ Sơ Cử Tri (Voter Profile Card) hiển thị trực quan địa chỉ ví, nút copy 1 chạm, quyền cử tri (Đã duyệt / Chưa duyệt), trạng thái bỏ phiếu
- [x] Bổ sung Modal Xác Nhận Bỏ Phiếu (Voting Confirmation Dialog) cảnh báo tính bất biến on-chain trước khi ký
- [x] Thiết kế bảng vinh danh người thắng cuộc (Winner Podium / Spotlight) hiệu ứng hào quang vàng kim khi trạng thái là `Ended`
- [x] Tối ưu hiển thị responsive đa thiết bị (Desktop, Tablet, Mobile) với Glassmorphism Dark Mode
- [x] Biên soạn cẩm nang bảo vệ đồ án `README_FRONTEND.md` chi tiết cho Thành viên 3
- **Status:** complete

### Phase 6: System Integration & End-to-End Simulation (Tích hợp Hệ thống & Mô phỏng E2E - Cả nhóm)
- [x] Viết kịch bản khởi tạo tự động `scripts/seed.js` triển khai contract, thêm 3 ứng viên, cấp quyền 4 cử tri, mô phỏng bỏ phiếu để demo nhanh
- [x] Bổ sung script `"seed"` vào `package.json`
- [ ] Kiểm thử E2E trên trình duyệt với MetaMask (kiểm tra từ chối ký, sai số gas, sai mạng)
- **Status:** in_progress

### Phase 7: Project Documentation & Presentation Prep (Tài liệu hóa, Báo cáo & Thuyết trình - Cả nhóm)
- [x] Cập nhật toàn diện `README.md` với hướng dẫn cài đặt từng bước, sơ đồ kiến trúc hệ thống và liên kết cẩm nang Thành viên 3
- [ ] Soạn thảo khung Báo cáo Đồ án chi tiết (Word / Markdown) gồm lý thuyết Blockchain, thiết kế Smart Contract, kết quả thử nghiệm
- [ ] Chuẩn bị kịch bản thuyết trình và slide demo cho 3 thành viên theo đúng phân công nhiệm vụ
- **Status:** pending

## Decisions Made
| Quyết định | Lý do & Căn cứ |
| :--- | :--- |
| Giữ nguyên kiến trúc DApp thuần không Backend server | Tránh over-engineering theo `/pony-tail`. Mọi dữ liệu nằm on-chain, giao tiếp trực tiếp qua RPC/MetaMask. |
| Sử dụng Ethers.js v6 CDN cho frontend | Giảm phụ thuộc bundler (Webpack/Vite), chạy trực tiếp với Live Server, sinh viên dễ nộp bài và demo. |
| Xây dựng Toast & Modal thuần CSS/JS | Không phụ thuộc thư viện nặng như SweetAlert2/Bootstrap, kiểm soát 100% mã nguồn và trả lời tự tin trước hội đồng. |
| Dùng `contract-config.json` kết nối giữa Deploy script và Frontend | Đảm bảo Thành viên 2 và Thành viên 3 không cần hardcode địa chỉ ví hay can thiệp thủ công. |
| Tách biệt rõ ràng 3 vai trò trong nhóm | Phù hợp yêu cầu phân công nhiệm vụ trong `README.md` cho buổi bảo vệ đồ án. |

## Notes
- Hệ thống đã kiểm thử 27/27 unit test pass 100%.
- Frontend đã hoàn thiện giao diện chuyên nghiệp, sẵn sàng demo bảo vệ đồ án.
