# CẨM NANG BẢO VỆ ĐỒ ÁN - DÀNH RIÊNG CHO THÀNH VIÊN 3 (FRONTEND UI/UX ENGINEER)

> **Dành cho:** Thành viên 3 - Kỹ sư Giao diện & Trải nghiệm Người dùng (Frontend UI/UX)  
> **Phân hệ phụ trách:** `frontend/index.html`, `frontend/style.css`, `frontend/app.js` (DOM Rendering, Toast Notification, Progress Bar, Podium)  

---

## 📌 1. TỔNG QUAN VAI TRÒ CỦA THÀNH VIÊN 3
Trong đồ án Blockchain DApp, **Thành viên 3** chịu trách nhiệm thiết kế toàn bộ cầu nối trực quan giữa người dùng cuối (Cử tri & Admin) với công nghệ Blockchain vốn phức tạp và trừu tượng:
1. **Thiết kế giao diện hiện đại (Modern Dark UI & Glassmorphism):** Trực quan hóa dữ liệu on-chain, tối ưu hiển thị responsive trên máy tính và điện thoại.
2. **Hệ thống phản hồi trạng thái giao dịch (Toast Notification & Modal):** Thay thế hoàn toàn các hàm `alert()` thô sơ bằng thanh thông báo trạng thái giao dịch Web3 thời gian thực (Đang gửi -> Chờ thợ đào xác nhận -> Thành công / Thất bại).
3. **Trực quan hóa dữ liệu bình chọn (Data Visualization):**
   - Thanh phần trăm phiếu bầu linh hoạt (Vote Percentage Bar) kèm highlight ứng cử viên dẫn đầu.
   - Thẻ hồ sơ cử tri (Voter Profile Card) hiển thị tức thì quyền hạn và trạng thái bỏ phiếu của ví đang kết nối.
   - Bảng vinh danh người chiến thắng (Winner Podium / Spotlight) khi cuộc bầu cử kết thúc.

---

## 🏗️ 2. CHI TIẾT CÁC CỤM CHỨC NĂNG DO THÀNH VIÊN 3 PHỤ TRÁCH

### Cụm 1: Hệ Thống Toast Notification Tự Động (`app.js` & `style.css`)
- **Vấn đề giải quyết:** Hàm `alert()` mặc định của trình duyệt chặn luồng thao tác (blocking thread), gây gián đoạn trải nghiệm người dùng Web3.
- **Giải pháp:** Xây dựng module thông báo nổi `showToast(title, message, type, duration)` với 5 trạng thái:
  - `success` (Xanh lá): Ký giao dịch thành công, thêm ứng viên thành công.
  - `error` (Đỏ): Giao dịch thất bại, từ chối ký, lỗi Smart Contract.
  - `warning` (Vàng): Chưa kết nối ví, nhập sai định dạng ví 0x...
  - `info` (Xanh dương): Sự kiện On-Chain phát sinh từ cử tri khác.
  - `loading` (Tím kèm Spinner xoay): Giao dịch đang được phát sóng và chờ xác thực khối (Block Confirmation).
- **Thanh tiến độ đếm ngược:** Mỗi toast tự động có thanh `progress-bar` giảm dần theo thời gian hiển thị trước khi biến mất mượt mà (`toast-hiding`).

### Cụm 2: Modal Xác Nhận Bỏ Phiếu (Voting Confirmation Dialog)
- **Vấn đề giải quyết:** Trên Blockchain, giao dịch một khi đã ký và gửi lên mạng là **bất biến (Immutable)**, không thể hoàn tác và tốn phí Gas.
- **Giải pháp:** Khi cử tri bấm "Bình Chọn", hệ thống mở Modal popup hiển thị:
  - Tên và mã số ứng cử viên được chọn.
  - Hộp cảnh báo nhấn mạnh tính bất biến của Blockchain.
  - Nút "Ký Xác Nhận Bỏ Phiếu" và "Hủy Bỏ", ngăn chặn việc bấm nhầm của người dùng.

### Cụm 3: Thanh Phần Trăm Phiếu Bầu Động (Dynamic Percentage Bar)
- **Công thức tính toán:**
  $$\text{Percentage} = \frac{\text{Candidate Vote Count}}{\text{Total Votes}} \times 100\%$$
- **Hiệu ứng trực quan:**
  - Ứng viên đang dẫn đầu sẽ tự động nhận dải màu Gold/Amber (`lead-candidate`).
  - Thanh fill chuyển động mượt mà với thuộc tính `transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1)`.

### Cụm 4: Thẻ Hồ Sơ Cử Tri (Voter Profile Card)
- Ngay khi người dùng kết nối ví MetaMask:
  - Tra cứu hàm `voters(address)` trên Smart Contract.
  - Tự động hiển thị huy hiệu: **Đã Cấp Quyền (Hợp lệ) ✅** hoặc **Chưa Cấp Quyền ❌**.
  - Hiển thị trạng thái phiếu: **Đã Bỏ Phiếu (Ứng viên #X)** hoặc **Chưa Bỏ Phiếu**.
  - Tích hợp nút sao chép địa chỉ ví (Copy to Clipboard) chỉ với 1 click.

### Cụm 5: Bảng Vinh Danh Quán Quân (Winner Spotlight)
- Khi `currentStatus == 2` (Giai đoạn `Ended`):
  - Kích hoạt khối Podium hiệu ứng hào quang vàng kim (`spotlightGlow` & `trophyFloat`).
  - Gọi hàm `getWinner()` từ Smart Contract để công bố họ tên và số phiếu chiến thắng.
  - Tự động gắn viền vàng và cờ hiệu `WINNER` lên thẻ của ứng viên thắng cử trong danh sách.

---

## 🎯 3. CÂU HỎI PHẢN BIỆN BẢO VỆ ĐỒ ÁN THƯỜNG GẶP (HỘI ĐỒNG HỎI & CÁCH TRẢ LỜI)

### Câu 1: Tại sao nhóm lại sử dụng Vanilla HTML/CSS/JS thay vì React, Vue hoặc Next.js?
> **Cách trả lời:**  
> *"Dạ thưa Thầy/Cô, nhóm lựa chọn Vanilla HTML/CSS/JS kết hợp trực tiếp với Ethers.js v6 qua CDN nhằm đạt được 3 mục tiêu cốt lõi:*  
> *1. **Đơn giản hóa việc chấm thi và chuyển giao:** Giảng viên hoặc người dùng chỉ cần mở tệp `index.html` hoặc chạy Live Server là DApp chạy ngay lập tức, không cần tải hàng trăm Megabyte thư viện `node_modules` hay lo lắng lỗi xung đột phiên bản Node/Webpack.*  
> *2. **Tối ưu hiệu năng:** Giao diện tải cực nhanh, dung lượng mã nguồn nhẹ chỉ vài Kilobyte, DOM được cập nhật trực tiếp không qua tầng Virtual DOM trung gian.*  
> *3. **Tập trung vào logic cốt lõi Web3:** Mã nguồn sạch sẽ, tách bạch rõ ràng giữa tầng hiển thị DOM và tầng tương tác Smart Contract, giúp hội đồng dễ dàng theo dõi cách frontend bắt các sự kiện on-chain."*

### Câu 2: Làm thế nào giao diện tự cập nhật khi một cử tri khác bỏ phiếu mà không cần nhấn F5 tải lại trang?
> **Cách trả lời:**  
> *"Dạ thưa Thầy/Cô, nhóm đã tích hợp cơ chế **Web3 Event Listeners** trong `frontend/app.js` thông qua các sự kiện được định nghĩa trong Smart Contract như `VoteCasted`, `CandidateAdded`, `StatusChanged`.*  
> *Khi một giao dịch được xác thực trên Blockchain, nút RPC sẽ bắn tín hiệu sự kiện thời gian thực (Real-time Event) về MetaMask. Ethers.js bắt sự kiện thông qua hàm `votingContract.on('VoteCasted', ...)` và ngay lập tức gọi hàm `reloadData()` để tái render số phiếu, thanh tiến độ và thông báo Toast tới người dùng mà hoàn toàn không cần tải lại trang."*

### Câu 3: Làm thế nào để giao diện ngăn chặn cử tri bấm liên tục vào nút bỏ phiếu hoặc gian lận?
> **Cách trả lời:**  
> *"Dạ thưa Thầy/Cô, hệ thống bảo vệ theo **mô hình phòng thủ 2 lớp (Two-Layer Defense)**:*  
> *1. **Lớp Frontend (UX):** Sau khi cử tri đã bỏ phiếu (`voterInfo.hasVoted == true`) hoặc khi cuộc bầu cử chưa mở/đã kết thúc, nút Bình Chọn sẽ bị vô hiệu hóa (`disabled`) và chuyển đổi trạng thái màu xám. Khi người dùng vừa gửi giao dịch, hệ thống hiển thị Loading Toast và chặn tương tác trùng lặp.*  
> *2. **Lớp Smart Contract (Bảo mật tuyệt đối):** Dù kẻ tấn công có cố tình sửa mã JavaScript trên trình duyệt (F12) để kích hoạt nút, giao dịch khi gửi lên Blockchain vẫn sẽ bị chặn đứng bởi lệnh `require(!sender.hasVoted)` trong hàm `vote()` của Smart Contract và giao dịch sẽ bị hoàn tác (Revert)."*

### Câu 4: Phần trăm số phiếu bầu của từng ứng viên được tính toán ở đâu? Tại sao không tính trong Smart Contract?
> **Cách trả lời:**  
> *"Dạ thưa Thầy/Cô, tỷ lệ phần trăm được tính toán tại **Tầng Frontend (Client-side)** dựa trên số phiếu của ứng viên và `totalVotes` do Smart Contract cung cấp.*  
> *Lý do kỹ thuật: Trong Solidity không hỗ trợ số thực (Floating-point numbers như 33.3%). Nếu tính toán số thực trong Smart Contract sẽ phải nhân chia số nguyên phức tạp và tốn thêm chi phí Gas của người dùng một cách không cần thiết. Vì vậy, nguyên tắc thiết kế DApp chuẩn mực là: **Dữ liệu thô và xác thực tính đúng đắn thuộc về Smart Contract, còn định dạng và biểu diễn phần trăm hiển thị thuộc về Frontend**."*

### Câu 5: Hệ thống xử lý ra sao nếu người dùng từ chối ký giao dịch trên MetaMask?
> **Cách trả lời:**  
> *"Dạ thưa Thầy/Cô, khi người dùng bấm 'Reject' trên MetaMask, thư viện Ethers.js sẽ ném ra ngoại lệ với mã lỗi `ACTION_REJECTED`. Hàm `executeVote()` trong `frontend/app.js` sử dụng khối lệnh `try...catch` để bắt lỗi này, đóng Loading Toast và phát thông báo Toast cảnh báo màu đỏ với nội dung thân thiện: 'Bạn đã hủy giao dịch trên ví MetaMask', tránh việc ứng dụng bị treo hoặc người dùng hoang mang."*
