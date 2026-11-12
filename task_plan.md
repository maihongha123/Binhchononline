# Kế Hoạch Dự Án: Hệ Thống Bình Chọn Trực Tuyến Blockchain (BINHCHONONLINE)

## 1. MỤC TIÊU DỰ ÁN (GOAL)
Xây dựng, hoàn thiện, kiểm thử và triển khai toàn diện hệ thống DApp bình chọn trực tuyến trên nền tảng Blockchain Ethereum (Solidity, Sepolia Testnet, Remix IDE, Ethers.js v6, Vercel) với cấu trúc phân quyền file độc lập cho 3 thành viên, lịch sử Git chuẩn mực (**mỗi thành viên đúng 9 commits chất lượng cao = 27 commits tổng**), sẵn sàng cho buổi báo cáo và bảo vệ đồ án đạt điểm tối đa.

---

## 2. BẢNG PHÂN CHIA TRÁCH NHIỆM & QUYỀN SỞ HỮU FILE (FILE OWNERSHIP)

| Thành viên | Vai trò chuyên môn | Các tệp & thư mục chịu trách nhiệm 100% |
| :--- | :--- | :--- |
| **Thành viên 1** | Smart Contract & Core Logic Engineer | `contracts/Voting.sol`<br>`test/Voting.test.js` |
| **Thành viên 2** (Bạn) | Web3 Middleware & Deployment Engineer | `scripts/deploy.js`<br>`scripts/seed.js`<br>`hardhat.config.js`<br>`frontend/contract-config.json`<br>`frontend/js/web3-service.js` |
| **Thành viên 3** | Frontend UI/UX & Interaction Developer | `frontend/index.html`<br>`frontend/style.css`<br>`frontend/js/ui-controller.js` |
| **Cả nhóm** | Tích hợp & Cầu nối điều phối | `frontend/js/main.js`<br>`README.md`<br>`task_plan.md` |

---

## 3. LỘ TRÌNH 9 PHASES LIÊN HOÀN CHO 3 THÀNH VIÊN
*(Mỗi Phase quy định rõ: Ai làm việc gì, sửa file nào, và câu lệnh Git Commit cụ thể ngay sau khi hoàn thành)*

```
[Phase 1: Khởi tạo nền tảng] ────────► TV1 commit | TV2 commit | TV3 commit
[Phase 2: Định nghĩa dữ liệu & UI] ──► TV1 commit | TV2 commit | TV3 commit
[Phase 3: Phân quyền & Kết nối Ví] ──► TV1 commit | TV2 commit | TV3 commit
[Phase 4: Sự kiện Realtime & Sepolia]► TV1 commit | TV2 commit | TV3 commit
[Phase 5: Quản trị Admin & Tx Calls] ─► TV1 commit | TV2 commit | TV3 commit
[Phase 6: Bỏ phiếu & Tiến độ %] ─────► TV1 commit | TV2 commit | TV3 commit
[Phase 7: Tính Winner & Toasts] ─────► TV1 commit | TV2 commit | TV3 commit
[Phase 8: Unit Tests & Modal Confirm]► TV1 commit | TV2 commit | TV3 commit
[Phase 9: Deploy Remix & Spotlight] ─► TV1 commit | TV2 commit | TV3 commit
```

---

### PHASE 1: KHỞI TẠO NỀN TẢNG DỰ ÁN & BỐ CỤC KIẾN TRÚC
* **Mục tiêu:** Tạo khung sườn ban đầu cho Hợp đồng thông minh, kịch bản triển khai và giao diện Web.

* **Thành viên 1:**
  - *Công việc:* Tạo file `contracts/Voting.sol`, khai báo `SPDX-License-Identifier: MIT`, `pragma solidity ^0.8.20`, và định danh `contract Voting`.
  - *Tệp tác động:* `contracts/Voting.sol`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add contracts/Voting.sol
    git commit -m "feat(contract): Khởi tạo hợp đồng Voting và định nghĩa SPDX License 0.8.20"
    ```

* **Thành viên 2:**
  - *Công việc:* Tạo file `scripts/deploy.js` sử dụng thư viện `hardhat` và `ethers`, viết hàm xuất cấu hình sang `frontend/contract-config.json`.
  - *Tệp tác động:* `scripts/deploy.js`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add scripts/deploy.js
    git commit -m "feat(deploy): Xây dựng script Hardhat deployment và trích xuất config tự động"
    ```

* **Thành viên 3:**
  - *Công việc:* Tạo file `frontend/index.html` với cấu trúc semantic: header, brand logo, panel thống kê, sidebar điều khiển, grid ứng cử viên.
  - *Tệp tác động:* `frontend/index.html`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add frontend/index.html
    git commit -m "feat(ui): Thiết kế khung HTML5 ngữ nghĩa cho giao diện DApp bình chọn"
    ```

---

### PHASE 2: ĐỊNH NGHĨA CẤU TRÚC DỮ LIỆU & GIAO DIỆN NỀN TẢNG
* **Mục tiêu:** Thiết lập các cấu trúc dữ liệu cốt lõi trên EVM, nạp dữ liệu mẫu và xây dựng bảng màu giao diện.

* **Thành viên 1:**
  - *Công việc:* Khai báo `struct Candidate` (id, name, voteCount), `struct Voter` (isRegistered, hasVoted, votedCandidateId) và `enum WorkflowStatus` (Registering, Voting, Ended).
  - *Tệp tác động:* `contracts/Voting.sol`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add contracts/Voting.sol
    git commit -m "feat(contract): Khai báo Structs Candidate, Voter và enum WorkflowStatus"
    ```

* **Thành viên 2:**
  - *Công việc:* Viết script `scripts/seed.js` tự động tạo 3 ứng viên mẫu, cấp quyền cho 4 cử tri và thực hiện bỏ phiếu giả lập phục vụ demo nhanh.
  - *Tệp tác động:* `scripts/seed.js`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add scripts/seed.js
    git commit -m "feat(deploy): Viết script seed.js khởi tạo dữ liệu mẫu 3 ứng viên và 4 cử tri"
    ```

* **Thành viên 3:**
  - *Công việc:* Tạo file `frontend/style.css` xây dựng theme Dark Mode Glassmorphism, hiệu ứng `backdrop-filter: blur`, neon glow và font chữ Plus Jakarta Sans.
  - *Tệp tác động:* `frontend/style.css`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add frontend/style.css
    git commit -m "feat(ui): Xây dựng bộ theme Dark Mode Glassmorphism hiện đại"
    ```

---

### PHASE 3: BẢO MẬT PHÂN QUYỀN & KẾT NỐI VÍ METAMASK
* **Mục tiêu:** Kiểm soát quyền hạn Admin, tích hợp Ethers.js v6 kết nối ví và thiết kế thẻ cử tri.

* **Thành viên 1:**
  - *Công việc:* Khai báo biến `address public admin`, `mapping(address => Voter) public voters`, `Candidate[] public candidates` và cài đặt 2 modifiers: `onlyAdmin` và `checkStatus(WorkflowStatus)`.
  - *Tệp tác động:* `contracts/Voting.sol`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add contracts/Voting.sol
    git commit -m "feat(contract): Thiết lập biến trạng thái state storage và modifiers kiểm soát quyền"
    ```

* **Thành viên 2:**
  - *Công việc:* Tạo module `frontend/js/web3-service.js`, viết class `Web3Service` xử lý nạp config, kiểm tra `window.ethereum`, kết nối `BrowserProvider` và lấy `getSigner()`.
  - *Tệp tác động:* `frontend/js/web3-service.js`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add frontend/js/web3-service.js
    git commit -m "feat(web3): Tách module web3-service.js kết nối Ethers.js v6 và MetaMask"
    ```

* **Thành viên 3:**
  - *Công việc:* Thiết kế Thẻ Hồ Sơ Cử Tri (`Voter Profile Card`) trên giao diện hiển thị địa chỉ ví rút gọn, role badge (Admin/Cử tri), trạng thái cấp quyền và trạng thái đã bầu.
  - *Tệp tác động:* `frontend/index.html`, `frontend/style.css`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add frontend/index.html frontend/style.css
    git commit -m "feat(ui): Thiết kế Thẻ hồ sơ cử tri Voter Profile Card hiển thị trạng thái ví"
    ```

---

### PHASE 4: SỰ KIỆN ON-CHAIN & ĐỒNG BỘ MẠNG TESTNET SEPOLIA
* **Mục tiêu:** Cài đặt hệ thống Event của EVM, hỗ trợ mạng Testnet công khai và hiển thị Timeline tiến độ.

* **Thành viên 1:**
  - *Công việc:* Khai báo 4 sự kiện chuẩn trong `Voting.sol`: `event CandidateAdded`, `event VoterRegistered`, `event StatusChanged`, `event VoteCasted`.
  - *Tệp tác động:* `contracts/Voting.sol`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add contracts/Voting.sol
    git commit -m "feat(contract): Xây dựng 4 sự kiện On-Chain phục vụ đồng bộ Web3 realtime"
    ```

* **Thành viên 2:**
  - *Công việc:* Cập nhật `hardhat.config.js` thêm cấu hình mạng Sepolia (ChainID 11155111, Unichain 1301) và viết hàm `ensureCorrectNetwork` tự động chuyển mạng trên MetaMask (`wallet_switchEthereumChain`).
  - *Tệp tác động:* `frontend/js/web3-service.js`, `hardhat.config.js`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add frontend/js/web3-service.js hardhat.config.js
    git commit -m "feat(web3): Xây dựng cơ chế tự động chuyển mạng Sepolia Testnet (0xaa36a7)"
    ```

* **Thành viên 3:**
  - *Công việc:* Xây dựng thanh Timeline 3 bước trực quan (`1. Đang Đăng Ký` $\rightarrow$ `2. Đang Bỏ Phiếu` $\rightarrow$ `3. Đã Kết Thúc`) với thanh nối connector phát sáng theo trạng thái.
  - *Tệp tác động:* `frontend/index.html`, `frontend/style.css`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add frontend/index.html frontend/style.css
    git commit -m "feat(ui): Xây dựng Timeline 3 bước hiển thị tiến trình cuộc bầu cử trực quan"
    ```

---

### PHASE 5: QUY TRÌNH QUẢN TRỊ ADMIN & ĐÓNG GÓI GIAO DỊCH ON-CHAIN
* **Mục tiêu:** Viết các hàm điều hành cuộc bầu cử của Admin và tạo module điều khiển giao diện UI.

* **Thành viên 1:**
  - *Công việc:* Cài đặt các hàm quản trị trong `Voting.sol`: `addCandidate(string memory _name)`, `registerVoter(address _voter)`, `startVoting()` (yêu cầu $\ge 2$ ứng viên), `endVoting()`.
  - *Tệp tác động:* `contracts/Voting.sol`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add contracts/Voting.sol
    git commit -m "feat(contract): Cài đặt các hàm quản trị addCandidate, registerVoter, startVoting, endVoting"
    ```

* **Thành viên 2:**
  - *Công việc:* Cài đặt các hàm gọi giao dịch trong `Web3Service`: `vote(candidateId)`, `addCandidate(name)`, `registerVoter(addr)`, `startVoting()`, `endVoting()`, xử lý bất đồng bộ với `await tx.wait()`.
  - *Tệp tác động:* `frontend/js/web3-service.js`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add frontend/js/web3-service.js
    git commit -m "feat(web3): Triển khai các phương thức giao dịch on-chain executeVote và Admin calls"
    ```

* **Thành viên 3:**
  - *Công việc:* Tạo module `frontend/js/ui-controller.js`, viết class `UIController` đóng gói DOM cache, hàm `updateWorkflowTimeline`, `updateVoterProfileCard`, và hàm bật/tắt quyền các nút Admin theo pha.
  - *Tệp tác động:* `frontend/js/ui-controller.js`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add frontend/js/ui-controller.js
    git commit -m "feat(ui): Tách module ui-controller.js quản lý DOM và render ứng cử viên"
    ```

---

### PHASE 6: BÌNH CHỌN CHỐNG GIAN LẬN & THANH TIẾN ĐỘ % THỜI GIAN THỰC
* **Mục tiêu:** Hoàn thiện hàm bỏ phiếu bất biến, lắng nghe sự kiện realtime và cập nhật số liệu trực quan.

* **Thành viên 1:**
  - *Công việc:* Cài đặt hàm `vote(uint256 _candidateId)` tuân thủ nguyên tắc bảo mật **Checks-Effects-Interactions**: kiểm tra whitelist, chặn bầu 2 lần (`!hasVoted`), cập nhật `hasVoted = true`, tăng `voteCount` và `emit VoteCasted`.
  - *Tệp tác động:* `contracts/Voting.sol`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add contracts/Voting.sol
    git commit -m "feat(contract): Cài đặt hàm vote theo chuẩn Checks-Effects-Interactions"
    ```

* **Thành viên 2:**
  - *Công việc:* Thiết lập 4 trình lắng nghe sự kiện On-Chain trong `Web3Service`: `contract.on("VoteCasted")`, `CandidateAdded`, `StatusChanged`, `VoterRegistered` để tự động làm mới dữ liệu không cần F5.
  - *Tệp tác động:* `frontend/js/web3-service.js`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add frontend/js/web3-service.js
    git commit -m "feat(web3): Thiết lập 4 trình lắng nghe sự kiện On-Chain thời gian thực từ EVM"
    ```

* **Thành viên 3:**
  - *Công việc:* Cài đặt thuật toán render danh sách ứng cử viên động trong `UIController`: tính toán tỷ lệ % phiếu bầu động, hiệu ứng chuyển động fill thanh tiến độ và viền vàng highlight ứng viên dẫn đầu.
  - *Tệp tác động:* `frontend/js/ui-controller.js`, `frontend/style.css`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add frontend/js/ui-controller.js frontend/style.css
    git commit -m "feat(ui): Cài đặt thanh tiến độ phần trăm phiếu bầu dynamic và highlight dẫn đầu"
    ```

---

### PHASE 7: TÍNH TOÁN NGƯỜI THẮNG CUỘC & HỆ THỐNG TOAST THAY THẾ ALERT
* **Mục tiêu:** Cài đặt hàm công bố kết quả, chuẩn hóa xử lý lỗi và xây dựng thông báo UI chuyên nghiệp.

* **Thành viên 1:**
  - *Công việc:* Cài đặt hàm `getWinner()` (thuật toán tìm max phiếu khi trạng thái là `Ended`) và các view functions `getCandidates()`, `getCandidatesCount()`.
  - *Tệp tác động:* `contracts/Voting.sol`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add contracts/Voting.sol
    git commit -m "feat(contract): Cài đặt hàm getWinner xác định người đắc cử và view functions"
    ```

* **Thành viên 2:**
  - *Công việc:* Viết hàm `parseError(err)` trong `Web3Service` chuẩn hóa các mã lỗi từ MetaMask: bắt sự kiện người dùng từ chối ký (`ACTION_REJECTED`), lỗi revert lý do tiếng Việt, lỗi gas.
  - *Tệp tác động:* `frontend/js/web3-service.js`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add frontend/js/web3-service.js
    git commit -m "feat(web3): Chuẩn hóa hệ thống bắt lỗi ngoại lệ ACTION_REJECTED và Revert reasons"
    ```

* **Thành viên 3:**
  - *Công việc:* Xây dựng hệ thống Toast Notifications 5 trạng thái (`success`, `error`, `warning`, `info`, `loading`) có thanh progress đếm ngược tự đóng và nút đóng nhanh.
  - *Tệp tác động:* `frontend/js/ui-controller.js`, `frontend/style.css`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add frontend/js/ui-controller.js frontend/style.css
    git commit -m "feat(ui): Xây dựng hệ thống Toast Notifications 5 trạng thái thay thế alert"
    ```

---

### PHASE 8: KIỂM THỬ TỰ ĐỘNG & HỘP THOẠI MODAL XÁC NHẬN BỎ PHIẾU
* **Mục tiêu:** Viết bộ test cases cơ bản, tối ưu trải nghiệm khôi phục phiên ví và hộp thoại xác nhận.

* **Thành viên 1:**
  - *Công việc:* Tạo file `test/Voting.test.js`, viết 15 unit tests tự động kiểm thử các luồng chức năng chuẩn: khởi tạo hợp đồng, thêm ứng viên, cấp quyền cử tri, mở/đóng hòm phiếu.
  - *Tệp tác động:* `test/Voting.test.js`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add test/Voting.test.js
    git commit -m "test(contract): Xây dựng bộ kiểm thử tự động 15 test cases cho logic cơ bản"
    ```

* **Thành viên 2:**
  - *Công việc:* Cài đặt hàm `autoConnect()` trong `Web3Service` sử dụng phương thức `eth_accounts` để tự động khôi phục kết nối ví khi người dùng bấm F5 mà không làm phiền mở popup MetaMask.
  - *Tệp tác động:* `frontend/js/web3-service.js`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add frontend/js/web3-service.js
    git commit -m "feat(web3): Cài đặt cơ chế autoConnect tự động khôi phục kết nối ví khi F5"
    ```

* **Thành viên 3:**
  - *Công việc:* Thiết kế Hộp thoại Modal Xác Nhận Bỏ Phiếu (`Confirm Vote Dialog`) hiển thị số hiệu, họ tên ứng cử viên được chọn và cảnh báo tính bất biến on-chain trước khi người dùng gửi giao dịch.
  - *Tệp tác động:* `frontend/index.html`, `frontend/js/ui-controller.js`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add frontend/index.html frontend/js/ui-controller.js
    git commit -m "feat(ui): Thiết kế Modal xác nhận bỏ phiếu trực quan chống thao tác nhầm"
    ```

---

### PHASE 9: KIỂM THỬ BIÊN, DEPLOY REMIX SEPOLIA & BẢNG VINH DANH PODIUM
* **Mục tiêu:** Mở rộng 27 test cases pass 100%, deploy hợp đồng lên Sepolia qua Remix IDE và hoàn thiện bảng vinh danh người đắc cử.

* **Thành viên 1:**
  - *Công việc:* Bổ sung 12 test cases biên trong `test/Voting.test.js`: kiểm thử chống bầu 2 lần, gọi vote trước/sau thời hạn, tài khoản lạ cố tình gọi hàm admin $\rightarrow$ đạt **27/27 test cases pass 100%**.
  - *Tệp tác động:* `test/Voting.test.js`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add test/Voting.test.js
    git commit -m "test(contract): Hoàn thiện 27 test cases bao phủ các trường hợp ngoại lệ và tấn công"
    ```

* **Thành viên 2:**
  - *Công việc:* Triển khai `Voting.sol` lên mạng Sepolia Testnet bằng Remix IDE (Admin MetaMask), xuất ABI & Contract Address sang `frontend/contract-config.json`, và hoàn thiện file cầu nối `frontend/js/main.js`.
  - *Tệp tác động:* `frontend/contract-config.json`, `frontend/js/main.js`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add frontend/contract-config.json frontend/js/main.js
    git commit -m "chore(deploy): Cập nhật địa chỉ hợp đồng từ Remix Sepolia và tích hợp main bridge"
    ```

* **Thành viên 3:**
  - *Công việc:* Thiết kế Bảng vinh danh Winner Spotlight (Podium hào quang vàng kim) hiển thị tên người chiến thắng và tỷ lệ % áp đảo khi cuộc bầu cử kết thúc, tối ưu hiển thị Responsive trên thiết bị di động.
  - *Tệp tác động:* `frontend/style.css`, `frontend/js/ui-controller.js`
  - *Lệnh commit sau khi xong:*
    ```bash
    git add frontend/style.css frontend/js/ui-controller.js
    git commit -m "feat(ui): Thiết kế Bảng vinh danh Winner Spotlight và tối ưu responsive mobile"
    ```

---

## 4. TỔNG KẾT BẢNG THỐNG KÊ 27 COMMITS CHO TOÀN BỘ DỰ ÁN

| STT | Thành viên | Phase | Commit Message (Conventional Commits) |
| :---: | :---: | :---: | :--- |
| 1 | **TV1** | Phase 1 | `feat(contract): Khởi tạo hợp đồng Voting và định nghĩa SPDX License 0.8.20` |
| 2 | **TV1** | Phase 2 | `feat(contract): Khai báo Structs Candidate, Voter và enum WorkflowStatus` |
| 3 | **TV1** | Phase 3 | `feat(contract): Thiết lập biến trạng thái state storage và modifiers kiểm soát quyền` |
| 4 | **TV1** | Phase 4 | `feat(contract): Xây dựng 4 sự kiện On-Chain phục vụ đồng bộ Web3 realtime` |
| 5 | **TV1** | Phase 5 | `feat(contract): Cài đặt các hàm quản trị addCandidate, registerVoter, startVoting, endVoting` |
| 6 | **TV1** | Phase 6 | `feat(contract): Cài đặt hàm vote theo chuẩn Checks-Effects-Interactions` |
| 7 | **TV1** | Phase 7 | `feat(contract): Cài đặt hàm getWinner xác định người đắc cử và view functions` |
| 8 | **TV1** | Phase 8 | `test(contract): Xây dựng bộ kiểm thử tự động 15 test cases cho logic cơ bản` |
| 9 | **TV1** | Phase 9 | `test(contract): Hoàn thiện 27 test cases bao phủ các trường hợp ngoại lệ và tấn công` |
| 10 | **TV2** | Phase 1 | `feat(deploy): Xây dựng script Hardhat deployment và trích xuất config tự động` |
| 11 | **TV2** | Phase 2 | `feat(deploy): Viết script seed.js khởi tạo dữ liệu mẫu 3 ứng viên và 4 cử tri` |
| 12 | **TV2** | Phase 3 | `feat(web3): Tách module web3-service.js kết nối Ethers.js v6 và MetaMask` |
| 13 | **TV2** | Phase 4 | `feat(web3): Xây dựng cơ chế tự động chuyển mạng Sepolia Testnet (0xaa36a7)` |
| 14 | **TV2** | Phase 5 | `feat(web3): Triển khai các phương thức giao dịch on-chain executeVote và Admin calls` |
| 15 | **TV2** | Phase 6 | `feat(web3): Thiết lập 4 trình lắng nghe sự kiện On-Chain thời gian thực từ EVM` |
| 16 | **TV2** | Phase 7 | `feat(web3): Chuẩn hóa hệ thống bắt lỗi ngoại lệ ACTION_REJECTED và Revert reasons` |
| 17 | **TV2** | Phase 8 | `feat(web3): Cài đặt cơ chế autoConnect tự động khôi phục kết nối ví khi F5` |
| 18 | **TV2** | Phase 9 | `chore(deploy): Cập nhật địa chỉ hợp đồng từ Remix Sepolia và tích hợp main bridge` |
| 19 | **TV3** | Phase 1 | `feat(ui): Thiết kế khung HTML5 ngữ nghĩa cho giao diện DApp bình chọn` |
| 20 | **TV3** | Phase 2 | `feat(ui): Xây dựng bộ theme Dark Mode Glassmorphism hiện đại` |
| 21 | **TV3** | Phase 3 | `feat(ui): Thiết kế Thẻ hồ sơ cử tri Voter Profile Card hiển thị trạng thái ví` |
| 22 | **TV3** | Phase 4 | `feat(ui): Xây dựng Timeline 3 bước hiển thị tiến trình cuộc bầu cử trực quan` |
| 23 | **TV3** | Phase 5 | `feat(ui): Tách module ui-controller.js quản lý DOM và render ứng cử viên` |
| 24 | **TV3** | Phase 6 | `feat(ui): Cài đặt thanh tiến độ phần trăm phiếu bầu dynamic và highlight dẫn đầu` |
| 25 | **TV3** | Phase 7 | `feat(ui): Xây dựng hệ thống Toast Notifications 5 trạng thái thay thế alert` |
| 26 | **TV3** | Phase 8 | `feat(ui): Thiết kế Modal xác nhận bỏ phiếu trực quan chống thao tác nhầm` |
| 27 | **TV3** | Phase 9 | `feat(ui): Thiết kế Bảng vinh danh Winner Spotlight và tối ưu responsive mobile` |

---

## 5. HƯỚNG DẪN THỰC HIỆN LỆNH GIT CHO TỪNG THÀNH VIÊN
Trước khi gõ lệnh `git commit`, mỗi bạn cần đảm bảo terminal của mình đã cấu hình đúng tác giả GitHub:
```bash
# Đối với Thành viên 1:
git config user.name "Tên_GitHub_Thành_Viên_1"
git config user.email "email_thanh_vien_1@gmail.com"

# Đối với Thành viên 2 (Bạn):
git config user.name "maihongha123"
git config user.email "email_cua_ban@gmail.com"

# Đối với Thành viên 3:
git config user.name "Tên_GitHub_Thành_Viên_3"
git config user.email "email_thanh_vien_3@gmail.com"
```
Khi thực hiện xong 9 phase trên, đồ án của nhóm sẽ có đúng **27 commits phân bổ đều đặn và chuyên nghiệp** trên biểu đồ đóng góp của GitHub!
