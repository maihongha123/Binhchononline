// ==============================================================================
// DỰ ÁN BÌNH CHỌN BLOCKCHAIN (DAPP)
// PHÂN HỆ: ĐIỀU PHỐI TÍCH HỢP HỆ THỐNG (SYSTEM ORCHESTRATION BRIDGE)
// TÁC GIẢ CHỊU TRÁCH NHIỆM: THÀNH VIÊN 2 (Web3 Middleware & Deployment Engineer)
// PHASE 9: Cập nhật địa chỉ hợp đồng từ Remix Sepolia và tích hợp main bridge
// KẾT NỐI: WEB3 SERVICE (THÀNH VIÊN 2) <---> UI CONTROLLER (THÀNH VIÊN 3)
// ==============================================================================

document.addEventListener("DOMContentLoaded", async () => {
  const ui = window.UIController;
  const web3 = window.Web3Service;

  // 1. Khởi tạo DOM Cache
  ui.initDOM();

  // 2. Tải cấu hình hợp đồng (contract-config.json)
  await web3.loadConfig();
  ui.updateNetworkBadge(web3.getNetworkName(), web3.chainId.toString());

  // 3. Hàm làm mới toàn bộ dữ liệu từ Blockchain
  async function refreshData(silent = false) {
    if (!silent) {
      ui.showToast("Đang làm mới", "Đang truy vấn dữ liệu mới nhất từ Blockchain...", "info", 1500);
    }

    try {
      const data = await web3.fetchElectionData();

      // Cập nhật số liệu thống kê
      ui.dom.electionTitleH1.textContent = data.title;
      ui.dom.totalVotesCount.textContent = data.totalVotes.toString();
      ui.dom.totalCandidatesCount.textContent = data.candidates.length.toString();

      // Cập nhật các phân hệ giao diện
      ui.updateNetworkBadge(web3.getNetworkName(), web3.chainId.toString());
      ui.updateWalletDisplay(data.currentAccount, data.isAdmin);
      ui.updateWorkflowTimeline(data.status);
      ui.updateVoterProfileCard(data.currentAccount, data.voterInfo, data.isAdmin, data.status);
      ui.updateAdminControls(data.status, data.isAdmin);
      ui.renderWinnerBanner(data.winner, data.totalVotes);

      // Render danh sách ứng cử viên kèm bộ gắn sự kiện bỏ phiếu
      ui.renderCandidates(
        data.candidates,
        data.status,
        data.totalVotes,
        data.highestVote,
        data.voterInfo,
        (candId, candName) => {
          // Khi cử tri bấm chọn ứng viên -> Mở Modal Xác Nhận
          ui.openVoteModal(candId, candName, async (id) => {
            await handleExecuteVote(id);
          });
        }
      );

    } catch (err) {
      console.error("[Bridge] Lỗi khi làm mới dữ liệu:", err);
    }
  }

  // 4. Thiết lập sự kiện On-Chain thời gian thực
  function setupLiveEvents() {
    web3.setupEventListeners({
      onVoteCasted: (voter, candidateId) => {
        const shortVoter = `${voter.substring(0, 6)}...${voter.substring(38)}`;
        ui.showToast("Sự Kiện Bỏ Phiếu", `Cử tri ${shortVoter} vừa bỏ phiếu cho Ứng viên #${candidateId}!`, "info", 4500);
        refreshData(true);
      },
      onCandidateAdded: (candidateId, name) => {
        ui.showToast("Ứng Viên Mới", `Quản trị viên đã ghi danh: "${name}" (#${candidateId})`, "info", 4500);
        refreshData(true);
      },
      onVoterRegistered: (voterAddress) => {
        if (web3.currentAccount && voterAddress.toLowerCase() === web3.currentAccount.toLowerCase()) {
          ui.showToast("Cấp Quyền Cử Tri", "Địa chỉ ví của bạn vừa được cấp quyền bỏ phiếu thành công!", "success", 5000);
        }
        refreshData(true);
      },
      onStatusChanged: (prevStatus, newStatus) => {
        let stName = "Đang diễn ra";
        if (newStatus === 1) stName = "BẮT ĐẦU BỎ PHIẾU!";
        else if (newStatus === 2) stName = "ĐÃ KẾT THÚC BẦU CỬ!";
        ui.showToast("Chuyển Giai Đoạn", `Cuộc bầu cử đã chuyển sang trạng thái: ${stName}`, "warning", 5000);
        refreshData(true);
      }
    });
  }

  // 5. Xử lý kết nối ví
  async function handleConnectWallet() {
    try {
      const loadToast = ui.showToast("Đang kết nối", "Vui lòng mở MetaMask và phê duyệt liên kết...", "loading", 0);
      const res = await web3.connect();
      ui.removeToast(loadToast);

      if (res) {
        ui.showToast("Kết Nối Thành Công", `Đã liên kết ví: ${res.account.substring(0, 6)}...${res.account.substring(38)}`, "success", 3500);
        setupLiveEvents();
        await refreshData(true);
      }
    } catch (err) {
      if (err.message === "PROTOCOL_FILE_NOT_ALLOWED") {
        ui.showToast("Yêu cầu Localhost", "MetaMask không hỗ trợ file:///. Vui lòng mở qua http://localhost:2000!", "warning", 5000);
        setTimeout(() => { window.location.href = "http://localhost:2000"; }, 1500);
        return;
      }
      if (err.message === "METAMASK_NOT_INSTALLED") {
        ui.showToast("Chưa Cài MetaMask", "Vui lòng cài đặt tiện ích MetaMask trên trình duyệt để tương tác!", "warning", 6000);
        return;
      }
      ui.showToast("Lỗi Kết Nối", web3.parseError(err), "error", 5000);
    }
  }

  // 6. Xử lý gửi phiếu bầu On-Chain
  async function handleExecuteVote(candidateId) {
    const txToast = ui.showToast("Đang gửi giao dịch", `Vui lòng ký giao dịch trên MetaMask để bầu cho #${candidateId}...`, "loading", 0);
    try {
      const { txHash } = await web3.vote(candidateId);
      ui.showToast("Đã Phát Sóng", `TxHash: ${txHash.substring(0, 10)}... Đang chờ xác nhận khối...`, "info", 5000);
      ui.removeToast(txToast);
      ui.showToast("Bình Chọn Thành Công!", `Phiếu bầu cho Ứng viên #${candidateId} đã được ghi nhận vào Blockchain!`, "success", 5000);
      await refreshData(true);
    } catch (err) {
      ui.removeToast(txToast);
      console.error("[Vote Error]:", err);
      ui.showToast("Bình Chọn Thất Bại", web3.parseError(err), "error", 6000);
    }
  }

  // 7. Gắn sự kiện các nút Quản trị (Admin Actions)
  ui.dom.addCandidateBtn.addEventListener("click", async () => {
    const name = ui.dom.candidateNameInput.value.trim();
    if (!name) {
      ui.showToast("Thiếu thông tin", "Vui lòng nhập họ và tên ứng cử viên!", "warning", 3000);
      return;
    }
    ui.dom.addCandidateBtn.disabled = true;
    const toastId = ui.showToast("Đang thêm ứng viên", `Đang gửi giao dịch thêm "${name}" lên Blockchain...`, "loading", 0);
    try {
      await web3.addCandidate(name);
      ui.dom.candidateNameInput.value = "";
      ui.removeToast(toastId);
      ui.showToast("Thành công", `Đã thêm ứng cử viên "${name}" vào danh sách!`, "success", 4000);
      await refreshData(true);
    } catch (err) {
      ui.removeToast(toastId);
      ui.showToast("Thêm thất bại", web3.parseError(err), "error", 5000);
    } finally {
      ui.dom.addCandidateBtn.disabled = false;
    }
  });

  ui.dom.registerVoterBtn.addEventListener("click", async () => {
    const addr = ui.dom.voterAddressInput.value.trim();
    if (!addr) {
      ui.showToast("Thiếu thông tin", "Vui lòng nhập địa chỉ ví cử tri!", "warning", 3000);
      return;
    }
    ui.dom.registerVoterBtn.disabled = true;
    const toastId = ui.showToast("Đang cấp quyền", `Đang ghi nhận quyền cử tri cho ${addr.substring(0, 8)}...`, "loading", 0);
    try {
      await web3.registerVoter(addr);
      ui.dom.voterAddressInput.value = "";
      ui.removeToast(toastId);
      ui.showToast("Cấp quyền thành công", `Đã thêm ví ${addr} vào Whitelist!`, "success", 4500);
      await refreshData(true);
    } catch (err) {
      ui.removeToast(toastId);
      ui.showToast("Cấp quyền thất bại", web3.parseError(err), "error", 5000);
    } finally {
      ui.dom.registerVoterBtn.disabled = false;
    }
  });

  ui.dom.startVotingBtn.addEventListener("click", async () => {
    ui.dom.startVotingBtn.disabled = true;
    const toastId = ui.showToast("Đang mở hòm phiếu", "Đang chuyển trạng thái sang giai đoạn Bỏ Phiếu...", "loading", 0);
    try {
      await web3.startVoting();
      ui.removeToast(toastId);
      ui.showToast("Bắt đầu bỏ phiếu", "Cuộc bình chọn đã chính thức MỞ! Cử tri hợp lệ có thể bỏ phiếu ngay bây giờ.", "success", 5000);
      await refreshData(true);
    } catch (err) {
      ui.removeToast(toastId);
      ui.showToast("Lỗi mở cuộc bình chọn", web3.parseError(err), "error", 5000);
    } finally {
      ui.dom.startVotingBtn.disabled = false;
    }
  });

  ui.dom.endVotingBtn.addEventListener("click", async () => {
    ui.dom.endVotingBtn.disabled = true;
    const toastId = ui.showToast("Đang đóng hòm phiếu", "Đang khóa hòm phiếu và chuyển sang giai đoạn Kết Thúc...", "loading", 0);
    try {
      await web3.endVoting();
      ui.removeToast(toastId);
      ui.showToast("Bầu cử kết thúc", "Cuộc bình chọn đã chính thức ĐÓNG! Kết quả đã được vinh danh trên bục Podium.", "success", 5000);
      await refreshData(true);
    } catch (err) {
      ui.removeToast(toastId);
      ui.showToast("Lỗi đóng cuộc bình chọn", web3.parseError(err), "error", 5000);
    } finally {
      ui.dom.endVotingBtn.disabled = false;
    }
  });

  // 8. Các tiện ích phụ trợ (Copy địa chỉ ví, Làm mới dữ liệu)
  const copyAddressHandler = () => {
    if (!web3.currentAccount) return;
    navigator.clipboard.writeText(web3.currentAccount).then(() => {
      ui.showToast("Đã sao chép", "Đã chép địa chỉ ví vào Clipboard!", "info", 2000);
    });
  };
  ui.dom.copyAddressBtn.addEventListener("click", copyAddressHandler);
  ui.dom.userAccountSpan.addEventListener("click", copyAddressHandler);

  ui.dom.connectWalletBtn.addEventListener("click", handleConnectWallet);
  ui.dom.refreshDataBtn.addEventListener("click", () => refreshData(false));
  ui.dom.cancelVoteBtn.addEventListener("click", () => ui.closeVoteModal());

  // 9. Lắng nghe sự kiện thay đổi tài khoản hoặc mạng trên MetaMask
  if (typeof window !== "undefined" && window.ethereum) {
    window.ethereum.on("accountsChanged", (accounts) => {
      console.log("[MetaMask] Tài khoản thay đổi:", accounts);
      window.location.reload();
    });

    window.ethereum.on("chainChanged", (chainId) => {
      console.log("[MetaMask] Mạng thay đổi:", chainId);
      window.location.reload();
    });
  }

  // 10. Tự động kết nối nếu ví đã được ủy quyền trước đó (khi F5)
  try {
    const autoRes = await web3.autoConnect();
    if (autoRes) {
      setupLiveEvents();
      await refreshData(true);
    }
  } catch (e) {
    console.log("[AutoConnect] Không có phiên đăng nhập cũ.");
  }
});

