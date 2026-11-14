// ==============================================================================
// DỰ ÁN BÌNH CHỌN BLOCKCHAIN (DAPP)
// PHÂN HỆ: GIAO DIỆN NGƯỜI DÙNG & TƯƠNG TÁC (UI/UX)
// TÁC GIẢ CHỊU TRÁCH NHIỆM: THÀNH VIÊN 3 (Frontend UI/UX Developer)
// PHASE 5: Tách module ui-controller.js quản lý DOM và render ứng cử viên
// ==============================================================================

class UIController {
  constructor() {
    this.toastCounter = 0;
    this.dom = {};
    this.pendingVoteId = null;
    this.pendingVoteName = null;
  }

  /**
   * Khởi tạo và lưu cache toàn bộ các tham chiếu DOM Elements
   */
  initDOM() {
    this.dom = {
      // Toast & Modal
      toastContainer: document.getElementById("toastContainer"),
      confirmModal: document.getElementById("confirmModal"),
      modalCandBadge: document.getElementById("modalCandBadge"),
      modalCandidateName: document.getElementById("modalCandidateName"),
      cancelVoteBtn: document.getElementById("cancelVoteBtn"),
      confirmVoteBtn: document.getElementById("confirmVoteBtn"),

      // Header & Wallet
      networkBadge: document.getElementById("networkBadge"),
      connectWalletBtn: document.getElementById("connectWalletBtn"),
      walletInfo: document.getElementById("walletInfo"),
      userAccountSpan: document.getElementById("userAccount"),
      userRoleSpan: document.getElementById("userRole"),
      copyAddressBtn: document.getElementById("copyAddressBtn"),
      refreshDataBtn: document.getElementById("refreshDataBtn"),
      electionTitleH1: document.getElementById("electionTitle"),

      // Dashboard Stats
      statusBadge: document.getElementById("statusBadge"),
      totalCandidatesCount: document.getElementById("totalCandidatesCount"),
      totalVotesCount: document.getElementById("totalVotesCount"),
      candidateList: document.getElementById("candidateList"),
      voterStatusNotice: document.getElementById("voterStatusNotice"),
      filterStatusText: document.getElementById("filterStatusText"),

      // Timeline Steps
      stepRegistering: document.getElementById("stepRegistering"),
      stepVoting: document.getElementById("stepVoting"),
      stepEnded: document.getElementById("stepEnded"),
      connector1: document.getElementById("connector1"),
      connector2: document.getElementById("connector2"),

      // Voter Profile Card
      voterCardAddress: document.getElementById("voterCardAddress"),
      voterCardRegistration: document.getElementById("voterCardRegistration"),
      voterCardVoteStatus: document.getElementById("voterCardVoteStatus"),

      // Admin Controls
      candidateNameInput: document.getElementById("candidateNameInput"),
      addCandidateBtn: document.getElementById("addCandidateBtn"),
      voterAddressInput: document.getElementById("voterAddressInput"),
      registerVoterBtn: document.getElementById("registerVoterBtn"),
      startVotingBtn: document.getElementById("startVotingBtn"),
      endVotingBtn: document.getElementById("endVotingBtn"),
      adminPermissionTag: document.getElementById("adminPermissionTag"),

      // Winner Spotlight
      winnerBanner: document.getElementById("winnerBanner"),
      winnerText: document.getElementById("winnerText"),
      winnerStats: document.getElementById("winnerStats")
    };
  }

  // ============================================================================
  // HỆ THỐNG TOAST NOTIFICATION 5 TRẠNG THÁI (SUCCESS, ERROR, WARNING, INFO, LOADING)
  // ============================================================================
  showToast(title, message, type = "info", duration = 4000) {
    if (!this.dom.toastContainer) return null;

    const toastId = `toast-${++this.toastCounter}`;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.id = toastId;

    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    else if (type === "error") icon = "❌";
    else if (type === "warning") icon = "⚠️";
    else if (type === "loading") icon = `<div class="toast-spinner"></div>`;

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${message}</div>
      </div>
      <button class="toast-close" title="Đóng">&times;</button>
      ${duration > 0 ? `<div class="toast-progress-track"><div class="toast-progress-bar"></div></div>` : ""}
    `;

    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => this.removeToast(toastId));

    this.dom.toastContainer.appendChild(toast);

    if (duration > 0) {
      const progressBar = toast.querySelector(".toast-progress-bar");
      if (progressBar) {
        progressBar.style.transition = `width ${duration}ms linear`;
        requestAnimationFrame(() => {
          progressBar.style.width = "0%";
        });
      }
      setTimeout(() => this.removeToast(toastId), duration);
    }

    return toastId;
  }

  removeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (!toast) return;
    toast.style.animation = "slideOutRight 0.3s forwards ease";
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }

  // ============================================================================
  // HỘP THOẠI MODAL XÁC NHẬN BỎ PHIẾU
  // ============================================================================
  openVoteModal(candidateId, candidateName, onConfirmCallback) {
    this.pendingVoteId = candidateId;
    this.pendingVoteName = candidateName;

    this.dom.modalCandBadge.textContent = `ỨNG CỬ VIÊN #${candidateId}`;
    this.dom.modalCandidateName.textContent = candidateName;
    this.dom.confirmModal.classList.remove("hidden");

    // Gắn sự kiện xác nhận duy nhất 1 lần
    const confirmHandler = async () => {
      this.dom.confirmVoteBtn.removeEventListener("click", confirmHandler);
      this.closeVoteModal();
      if (onConfirmCallback) await onConfirmCallback(candidateId, candidateName);
    };

    // Xóa listener cũ tránh kích hoạt lặp
    const newBtn = this.dom.confirmVoteBtn.cloneNode(true);
    this.dom.confirmVoteBtn.parentNode.replaceChild(newBtn, this.dom.confirmVoteBtn);
    this.dom.confirmVoteBtn = newBtn;
    this.dom.confirmVoteBtn.addEventListener("click", confirmHandler);
  }

  closeVoteModal() {
    this.dom.confirmModal.classList.add("hidden");
    this.pendingVoteId = null;
    this.pendingVoteName = null;
  }

  // ============================================================================
  // CẬP NHẬT HEADER & TRẠNG THÁI VÍ
  // ============================================================================
  updateNetworkBadge(networkName, chainId) {
    if (!this.dom.networkBadge) return;
    this.dom.networkBadge.innerHTML = `<span class="network-dot"></span> ${networkName} (${chainId})`;
  }

  updateWalletDisplay(account, isAdmin) {
    if (!account) {
      this.dom.connectWalletBtn.classList.remove("hidden");
      this.dom.walletInfo.classList.add("hidden");
      return;
    }

    const shortAddr = `${account.substring(0, 6)}...${account.substring(38)}`;
    this.dom.userAccountSpan.textContent = shortAddr;
    this.dom.userAccountSpan.title = account;

    if (isAdmin) {
      this.dom.userRoleSpan.textContent = "Admin";
      this.dom.userRoleSpan.style.backgroundColor = "#e11d48";
      this.dom.adminPermissionTag.textContent = "Bạn là Admin ✅";
      this.dom.adminPermissionTag.style.borderColor = "#10b981";
      this.dom.adminPermissionTag.style.color = "#34d399";
      this.dom.adminPermissionTag.style.background = "rgba(16, 185, 129, 0.15)";
    } else {
      this.dom.userRoleSpan.textContent = "Cử tri";
      this.dom.userRoleSpan.style.backgroundColor = "#2563eb";
      this.dom.adminPermissionTag.textContent = "Chỉ Admin (Xem) 🔒";
      this.dom.adminPermissionTag.style.borderColor = "";
      this.dom.adminPermissionTag.style.color = "";
      this.dom.adminPermissionTag.style.background = "";
    }

    this.dom.connectWalletBtn.classList.add("hidden");
    this.dom.walletInfo.classList.remove("hidden");
  }

  // ============================================================================
  // CẬP NHẬT MÁY TRẠNG THÁI VÀ TIMELINE 3 BƯỚC
  // ============================================================================
  updateWorkflowTimeline(status) {
    this.dom.statusBadge.className = "status-pill";
    [this.dom.stepRegistering, this.dom.stepVoting, this.dom.stepEnded].forEach(s => s.className = "step-item");
    [this.dom.connector1, this.dom.connector2].forEach(c => c.className = "step-connector");

    if (status === 0) {
      this.dom.statusBadge.textContent = "1. Đang Đăng Ký (Registering)";
      this.dom.statusBadge.classList.add("status-registering");
      this.dom.filterStatusText.textContent = "Giai đoạn Đăng ký (Chưa mở bình chọn)";
      this.dom.stepRegistering.classList.add("active");
    } else if (status === 1) {
      this.dom.statusBadge.textContent = "2. Đang Bỏ Phiếu (Voting Open)";
      this.dom.statusBadge.classList.add("status-voting");
      this.dom.filterStatusText.textContent = "Cổng bình chọn đang mở";
      this.dom.stepRegistering.classList.add("completed");
      this.dom.connector1.classList.add("completed");
      this.dom.stepVoting.classList.add("active");
    } else if (status === 2) {
      this.dom.statusBadge.textContent = "3. Đã Kết Thúc (Ended)";
      this.dom.statusBadge.classList.add("status-ended");
      this.dom.filterStatusText.textContent = "Hòm phiếu đã khóa";
      this.dom.stepRegistering.classList.add("completed");
      this.dom.connector1.classList.add("completed");
      this.dom.stepVoting.classList.add("completed");
      this.dom.connector2.classList.add("completed");
      this.dom.stepEnded.classList.add("active", "completed");
    }
  }

  // ============================================================================
  // THẺ HỒ SƠ CỬ TRI & THANH THÔNG BÁO VAI TRÒ
  // ============================================================================
  updateVoterProfileCard(account, voterInfo, isAdmin, status) {
    if (!account) {
      this.dom.voterCardAddress.textContent = "Chưa kết nối ví";
      this.dom.voterCardRegistration.innerHTML = `<span class="badge-pill badge-neutral">Chưa rõ</span>`;
      this.dom.voterCardVoteStatus.innerHTML = `<span class="badge-pill badge-neutral">Chưa rõ</span>`;
      this.dom.voterStatusNotice.innerHTML = `
        <span class="notice-icon">ℹ️</span>
        <span class="notice-text">Vui lòng kết nối ví MetaMask để tham gia bình chọn và xác thực quyền hạn.</span>
      `;
      return;
    }

    this.dom.voterCardAddress.textContent = `${account.substring(0, 8)}...${account.substring(36)}`;
    this.dom.voterCardAddress.title = account;

    // Trạng thái cấp quyền
    if (isAdmin) {
      this.dom.voterCardRegistration.innerHTML = `<span class="badge-pill badge-neutral">Quản trị viên (Admin)</span>`;
    } else if (voterInfo.isRegistered) {
      this.dom.voterCardRegistration.innerHTML = `<span class="badge-pill badge-success">Đã Cấp Quyền ✅</span>`;
    } else {
      this.dom.voterCardRegistration.innerHTML = `<span class="badge-pill badge-danger">Chưa Cấp Quyền ❌</span>`;
    }

    // Trạng thái bỏ phiếu
    if (voterInfo.hasVoted) {
      this.dom.voterCardVoteStatus.innerHTML = `<span class="badge-pill badge-success">Đã Bầu (Ứng viên #${voterInfo.votedCandidateId}) 🎉</span>`;
    } else if (status === 1 && voterInfo.isRegistered) {
      this.dom.voterCardVoteStatus.innerHTML = `<span class="badge-pill badge-neutral" style="color:#60a5fa;border:1px solid #3b82f6;">Chưa Bỏ Phiếu 🗳️</span>`;
    } else {
      this.dom.voterCardVoteStatus.innerHTML = `<span class="badge-pill badge-neutral">Chưa Bỏ Phiếu</span>`;
    }

    // Thanh thông báo vai trò
    if (isAdmin) {
      this.dom.voterStatusNotice.innerHTML = `
        <span class="notice-icon">⭐</span>
        <span class="notice-text">Bạn đang đăng nhập với tư cách <strong>Quản trị viên (Admin)</strong>. Bạn có toàn quyền thiết lập ứng viên, cấp quyền cử tri và điều hành kỳ bầu cử.</span>
      `;
    } else if (!voterInfo.isRegistered) {
      this.dom.voterStatusNotice.innerHTML = `
        <span class="notice-icon">⚠️</span>
        <span class="notice-text">Địa chỉ ví của bạn <strong>chưa được cấp quyền</strong>. Vui lòng liên hệ Admin để thêm địa chỉ ví của bạn vào Whitelist.</span>
      `;
    } else if (voterInfo.hasVoted) {
      this.dom.voterStatusNotice.innerHTML = `
        <span class="notice-icon">✅</span>
        <span class="notice-text">Bạn đã thực hiện quyền cử tri thành công! Phiếu bầu của bạn cho Ứng viên #${voterInfo.votedCandidateId} đã được ghi nhận bất biến trên Blockchain.</span>
      `;
    } else if (status === 1) {
      this.dom.voterStatusNotice.innerHTML = `
        <span class="notice-icon">🗳️</span>
        <span class="notice-text">Hòm phiếu đang <strong>mở</strong> và bạn <strong>được phép bỏ phiếu</strong>! Hãy chọn ứng viên mong muốn bên dưới và bấm nút Bầu Chọn.</span>
      `;
    } else if (status === 0) {
      this.dom.voterStatusNotice.innerHTML = `
        <span class="notice-icon">⏳</span>
        <span class="notice-text">Bạn đã được cấp quyền, nhưng cuộc bình chọn <strong>chưa bắt đầu</strong>. Vui lòng chờ Admin mở hòm phiếu.</span>
      `;
    } else {
      this.dom.voterStatusNotice.innerHTML = `
        <span class="notice-icon">🔒</span>
        <span class="notice-text">Cuộc bình chọn đã kết thúc. Cảm ơn bạn đã tham gia quan sát và theo dõi kết quả bầu cử!</span>
      `;
    }
  }

  // ============================================================================
  // PHASE 6 (Thành viên 3): RENDER DANH SÁCH ỨNG CỬ VIÊN VỚI THANH TIẾN ĐỘ % DYNAMIC & HIGHLIGHT
  // ============================================================================
  renderCandidates(candidates, status, totalVotes, highestVote, voterInfo, onVoteButtonClick) {
    this.dom.candidateList.innerHTML = "";

    if (!candidates || candidates.length === 0) {
      this.dom.candidateList.innerHTML = `
        <div class="empty-state">
          <p>Chưa có ứng cử viên nào được ghi danh trên Blockchain.</p>
        </div>
      `;
      return;
    }

    candidates.forEach(cand => {
      const percentage = totalVotes > 0 ? ((cand.voteCount / totalVotes) * 100).toFixed(1) : 0;
      const isLeading = highestVote > 0 && cand.voteCount === highestVote;
      const initial = cand.name ? cand.name.trim().charAt(0).toUpperCase() : "?";

      const card = document.createElement("div");
      card.className = `candidate-card ${isLeading ? 'leading-card' : ''}`;

      // Logic nút bấm bầu chọn
      let buttonDisabled = false;
      let buttonText = "Bầu Chọn Ứng Viên Này";

      if (status === 0) {
        buttonDisabled = true;
        buttonText = "Chưa Mở Bình Chọn";
      } else if (status === 1) {
        if (!voterInfo.isRegistered) {
          buttonDisabled = true;
          buttonText = "Chưa Được Cấp Quyền";
        } else if (voterInfo.hasVoted) {
          buttonDisabled = true;
          buttonText = voterInfo.votedCandidateId === cand.id ? "Bạn Đã Bầu ✅" : "Đã Bỏ Phiếu";
        }
      } else if (status === 2) {
        buttonDisabled = true;
        buttonText = "Đã Kết Thúc";
      }

      card.innerHTML = `
        <div>
          <div class="cand-top-row">
            <div class="cand-avatar">${initial}</div>
            <span class="candidate-badge">ỨNG CỬ VIÊN #${cand.id}</span>
          </div>
          <h4 class="candidate-name">${cand.name}</h4>

          <!-- Thanh Tiến Độ Phần Trăm Phiếu Bầu -->
          <div class="vote-progress-wrapper">
            <div class="progress-header">
              <span class="vote-count-text"><strong>${cand.voteCount}</strong> phiếu</span>
              <span class="vote-percentage-text">${percentage}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-bar-fill ${isLeading ? 'lead-candidate' : ''}" style="width: ${percentage}%"></div>
            </div>
          </div>
        </div>

        <button 
          class="btn btn-primary full-width vote-btn" 
          data-id="${cand.id}"
          data-name="${cand.name}"
          ${buttonDisabled ? "disabled" : ""}
        >
          ${buttonText}
        </button>
      `;

      const voteBtn = card.querySelector(".vote-btn");
      if (voteBtn && !buttonDisabled) {
        voteBtn.addEventListener("click", () => {
          if (onVoteButtonClick) onVoteButtonClick(cand.id, cand.name);
        });
      }

      this.dom.candidateList.appendChild(card);
    });
  }

  // ============================================================================
  // CẬP NHẬT CÁC NÚT ĐIỀU HÀNH ADMIN
  // ============================================================================
  updateAdminControls(status, isAdmin) {
    // Chỉ Admin mới được tương tác, hoặc vô hiệu hóa theo pha
    const canRegister = isAdmin && status === 0;
    const canStart = isAdmin && status === 0;
    const canEnd = isAdmin && status === 1;

    this.dom.addCandidateBtn.disabled = !canRegister;
    this.dom.candidateNameInput.disabled = !canRegister;
    this.dom.registerVoterBtn.disabled = !canRegister;
    this.dom.voterAddressInput.disabled = !canRegister;

    this.dom.startVotingBtn.disabled = !canStart;
    this.dom.endVotingBtn.disabled = !canEnd;
  }

  // ============================================================================
  // BẢNG VINH DANH NGƯỜI THẮNG CUỘC (WINNER SPOTLIGHT)
  // ============================================================================
  renderWinnerBanner(winner, totalVotes) {
    if (winner && winner.name) {
      const winVotes = winner.voteCount;
      const winPercent = totalVotes > 0 ? ((winVotes / totalVotes) * 100).toFixed(1) : 0;
      this.dom.winnerBanner.classList.remove("hidden");
      this.dom.winnerText.textContent = winner.name;
      this.dom.winnerStats.textContent = `Dẫn đầu áp đảo với ${winVotes}/${totalVotes} phiếu bầu (${winPercent}%)`;
    } else {
      this.dom.winnerBanner.classList.add("hidden");
    }
  }
}

// Khởi tạo đối tượng toàn cục duy nhất
window.UIController = new UIController();

