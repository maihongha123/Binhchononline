// ==============================================================================
// DỰ ÁN BÌNH CHỌN BLOCKCHAIN - PHÂN HỆ FRONTEND & WEB3
// - THÀNH VIÊN 2: Tầng Web3 Middleware, Tích hợp Ethers.js & Xử lý Giao dịch
// - THÀNH VIÊN 3: Tầng DOM Rendering, Giao diện Trải nghiệm Người dùng (UI/UX)
//                 Toast Notifications, Modal Xác nhận, Progress Bar & Podium
// ==============================================================================

// 1. CẤU HÌNH & BIẾN TOÀN CỤC
let CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const CONTRACT_ABI = [
  "function admin() view returns (address)",
  "function electionName() view returns (string)",
  "function currentStatus() view returns (uint8)",
  "function totalVotes() view returns (uint256)",
  "function getCandidates() view returns (tuple(uint256 id, string name, uint256 voteCount)[])",
  "function getCandidatesCount() view returns (uint256)",
  "function voters(address) view returns (bool isRegistered, bool hasVoted, uint256 votedCandidateId)",
  "function getWinner() view returns (string winnerName, uint256 highestVote)",
  "function addCandidate(string _name)",
  "function registerVoter(address _voter)",
  "function startVoting()",
  "function endVoting()",
  "function vote(uint256 _candidateId)",
  "event CandidateAdded(uint256 indexed candidateId, string name)",
  "event VoterRegistered(address indexed voterAddress)",
  "event StatusChanged(uint8 previousStatus, uint8 newStatus)",
  "event VoteCasted(address indexed voter, uint256 indexed candidateId)"
];

let provider;
let signer;
let votingContract;
let currentAccount = null;
let contractAdmin = null;
let dynamicAbi = null;
let pendingVoteCandidateId = null;

// 2. THAM CHIẾU DOM ELEMENTS
const toastContainer = document.getElementById("toastContainer");
const confirmModal = document.getElementById("confirmModal");
const modalCandBadge = document.getElementById("modalCandBadge");
const modalCandidateName = document.getElementById("modalCandidateName");
const cancelVoteBtn = document.getElementById("cancelVoteBtn");
const confirmVoteBtn = document.getElementById("confirmVoteBtn");

const connectWalletBtn = document.getElementById("connectWalletBtn");
const walletInfo = document.getElementById("walletInfo");
const userAccountSpan = document.getElementById("userAccount");
const userRoleSpan = document.getElementById("userRole");
const copyAddressBtn = document.getElementById("copyAddressBtn");
const refreshDataBtn = document.getElementById("refreshDataBtn");

const electionTitleH1 = document.getElementById("electionTitle");
const statusBadge = document.getElementById("statusBadge");
const totalCandidatesCount = document.getElementById("totalCandidatesCount");
const totalVotesCount = document.getElementById("totalVotesCount");
const candidateList = document.getElementById("candidateList");
const voterStatusNotice = document.getElementById("voterStatusNotice");
const winnerBanner = document.getElementById("winnerBanner");
const winnerText = document.getElementById("winnerText");
const winnerStats = document.getElementById("winnerStats");
const filterStatusText = document.getElementById("filterStatusText");

// Timeline Steps
const stepRegistering = document.getElementById("stepRegistering");
const stepVoting = document.getElementById("stepVoting");
const stepEnded = document.getElementById("stepEnded");
const connector1 = document.getElementById("connector1");
const connector2 = document.getElementById("connector2");

// Voter Profile Card
const voterCardAddress = document.getElementById("voterCardAddress");
const voterCardRegistration = document.getElementById("voterCardRegistration");
const voterCardVoteStatus = document.getElementById("voterCardVoteStatus");

// Admin Controls
const candidateNameInput = document.getElementById("candidateNameInput");
const addCandidateBtn = document.getElementById("addCandidateBtn");
const voterAddressInput = document.getElementById("voterAddressInput");
const registerVoterBtn = document.getElementById("registerVoterBtn");
const startVotingBtn = document.getElementById("startVotingBtn");
const endVotingBtn = document.getElementById("endVotingBtn");
const adminPermissionTag = document.getElementById("adminPermissionTag");

// ==============================================================================
// 3. HỆ THỐNG TOAST NOTIFICATION CHUYÊN NGHIỆP (THAY THẾ TOÀN BỘ ALERT)
// ==============================================================================
let toastCounter = 0;

function showToast(title, message, type = "info", duration = 4000) {
  const toastId = `toast-${++toastCounter}`;
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

  // Nút đóng
  const closeBtn = toast.querySelector(".toast-close");
  closeBtn.addEventListener("click", () => removeToast(toastId));

  toastContainer.appendChild(toast);

  // Thanh tiến độ đếm ngược
  if (duration > 0) {
    const progressBar = toast.querySelector(".toast-progress-bar");
    if (progressBar) {
      progressBar.style.transition = `width ${duration}ms linear`;
      requestAnimationFrame(() => {
        progressBar.style.width = "0%";
      });
    }

    toast._timeout = setTimeout(() => {
      removeToast(toastId);
    }, duration);
  }

  return toastId;
}

function removeToast(toastId) {
  const toast = document.getElementById(toastId);
  if (!toast) return;

  if (toast._timeout) clearTimeout(toast._timeout);
  toast.classList.add("toast-hiding");

  setTimeout(() => {
    if (toast.parentElement) {
      toast.parentElement.removeChild(toast);
    }
  }, 300);
}

// ==============================================================================
// 4. KẾT NỐI VÍ & KHỞI TẠO WEB3
// ==============================================================================
async function loadConfig() {
  try {
    const res = await fetch("contract-config.json");
    if (res.ok) {
      const data = await res.json();
      if (data.address) {
        CONTRACT_ADDRESS = data.address;
        console.log("[Config] Đã tải địa chỉ Contract:", CONTRACT_ADDRESS);
      }
      if (data.abi && Array.isArray(data.abi) && data.abi.length > 0) {
        dynamicAbi = data.abi;
        console.log("[Config] Đã tải toàn bộ ABI từ config!");
      }
    }
  } catch (err) {
    console.log("[Config] Sử dụng cấu hình Contract mặc định.");
  }
}

async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    showToast(
      "Chưa cài MetaMask",
      "Vui lòng cài đặt tiện ích mở rộng MetaMask trên trình duyệt để tương tác DApp!",
      "warning",
      6000
    );
    return;
  }

  const loadToast = showToast("Đang kết nối", "Vui lòng mở MetaMask và phê duyệt yêu cầu kết nối...", "loading", 0);

  try {
    provider = new ethers.BrowserProvider(window.ethereum);

    // Kiểm tra & yêu cầu chuyển mạng Hardhat Localhost (31337 / 0x7a69)
    const network = await provider.getNetwork();
    if (network.chainId !== 31337n) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x7a69" }]
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x7a69",
              chainName: "Hardhat Localhost",
              rpcUrls: ["http://127.0.0.1:8545"],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }
            }]
          });
        } else {
          throw switchError;
        }
      }
      provider = new ethers.BrowserProvider(window.ethereum);
    }

    signer = await provider.getSigner();
    currentAccount = await signer.getAddress();

    removeToast(loadToast);
    showToast("Kết nối thành công", `Đã liên kết ví: ${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`, "success", 3500);

    // Cập nhật giao diện ví
    userAccountSpan.textContent = `${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`;
    connectWalletBtn.classList.add("hidden");
    walletInfo.classList.remove("hidden");

    // Khởi tạo Smart Contract Object
    const activeAbi = dynamicAbi || CONTRACT_ABI;
    votingContract = new ethers.Contract(CONTRACT_ADDRESS, activeAbi, signer);

    // Bắt sự kiện thời gian thực On-Chain
    setupContractEvents();

    // Xác thực vai trò Admin
    contractAdmin = await votingContract.admin();
    const isAdmin = contractAdmin.toLowerCase() === currentAccount.toLowerCase();

    if (isAdmin) {
      userRoleSpan.textContent = "Admin";
      userRoleSpan.style.backgroundColor = "#e11d48";
      adminPermissionTag.textContent = "Bạn là Admin ✅";
      adminPermissionTag.style.borderColor = "#10b981";
      adminPermissionTag.style.color = "#34d399";
      adminPermissionTag.style.background = "rgba(16, 185, 129, 0.15)";
    } else {
      userRoleSpan.textContent = "Cử tri";
      userRoleSpan.style.backgroundColor = "#2563eb";
      adminPermissionTag.textContent = "Chỉ Admin (Xem) 🔒";
    }

    // Tải dữ liệu toàn hệ thống
    await reloadData();

  } catch (error) {
    removeToast(loadToast);
    console.error("Lỗi kết nối ví:", error);
    showToast("Lỗi kết nối", error.reason || error.message || "Người dùng đã từ chối yêu cầu kết nối.", "error", 5000);
  }
}

// Lắng nghe sự kiện thời gian thực (Real-time Events)
function setupContractEvents() {
  if (!votingContract) return;

  votingContract.removeAllListeners();

  votingContract.on("VoteCasted", (voter, candidateId) => {
    console.log(`[Event] VoteCasted: Cử tri ${voter} đã bầu cho #${candidateId}`);
    showToast("Sự kiện Mới", `Cử tri ${voter.substring(0, 6)}... vừa bỏ phiếu cho Ứng viên #${candidateId}!`, "info", 4000);
    reloadData();
  });

  votingContract.on("CandidateAdded", (candidateId, name) => {
    console.log(`[Event] CandidateAdded: ${name} (#${candidateId})`);
    showToast("Ứng viên Mới", `Quản trị viên đã thêm ứng viên: "${name}" (#${candidateId})`, "info", 4000);
    reloadData();
  });

  votingContract.on("VoterRegistered", (voterAddress) => {
    console.log(`[Event] VoterRegistered: ${voterAddress}`);
    if (currentAccount && voterAddress.toLowerCase() === currentAccount.toLowerCase()) {
      showToast("Quyền Bầu Cử", "Ví của bạn vừa được Quản trị viên cấp quyền bỏ phiếu!", "success", 5000);
    }
    reloadData();
  });

  votingContract.on("StatusChanged", (prevStatus, newStatus) => {
    console.log(`[Event] StatusChanged: ${prevStatus} -> ${newStatus}`);
    let stName = "Đang diễn ra";
    if (newStatus === 1) stName = "ĐÃ BẮT ĐẦU BỎ PHIẾU!";
    else if (newStatus === 2) stName = "ĐÃ KẾT THÚC BẦU CỬ!";
    showToast("Trạng thái Cuộc bầu cử", `Giai đoạn bầu cử đã chuyển sang: ${stName}`, "warning", 5000);
    reloadData();
  });
}

// ==============================================================================
// 5. RENDER DỮ LIỆU & GIAO DIỆN NGƯỜI DÙNG (DOM ENGINE)
// ==============================================================================
async function reloadData() {
  if (!votingContract) return;

  try {
    const title = await votingContract.electionName();
    const status = Number(await votingContract.currentStatus());
    const totalVotes = Number(await votingContract.totalVotes());

    electionTitleH1.textContent = title;
    totalVotesCount.textContent = totalVotes.toString();

    // 5.1 Cập nhật Trạng thái Pill & Timeline 3 bước
    updateWorkflowUI(status);

    // 5.2 Lấy danh sách ứng viên & tính tỷ lệ %
    const rawCandidates = await votingContract.getCandidates();
    totalCandidatesCount.textContent = rawCandidates.length.toString();

    // Tìm số phiếu cao nhất hiện tại để highlight
    let highestVoteCount = 0;
    const candidates = rawCandidates.map((c) => {
      const vCount = Number(c.voteCount);
      if (vCount > highestVoteCount) highestVoteCount = vCount;
      return {
        id: Number(c.id),
        name: c.name,
        voteCount: vCount
      };
    });

    renderCandidates(candidates, status, totalVotes, highestVoteCount);

    // 5.3 Cập nhật Thẻ Cử Tri (Voter Profile Card) & Notice
    if (currentAccount) {
      const voterInfo = await votingContract.voters(currentAccount);
      updateVoterCardAndNotice(voterInfo, status);
    }

    // 5.4 Cập nhật Trạng thái Khóa / Mở các nút Admin
    updateAdminControls(status);

    // 5.5 Banner Vinh danh Người thắng cuộc (Winner Spotlight)
    if (status === 2) {
      try {
        const winner = await votingContract.getWinner();
        const winnerName = winner[0];
        const winnerVotes = Number(winner[1]);
        const winPercent = totalVotes > 0 ? ((winnerVotes / totalVotes) * 100).toFixed(1) : 0;

        winnerBanner.classList.remove("hidden");
        winnerText.textContent = `${winnerName}`;
        winnerStats.textContent = `Dẫn đầu áp đảo với ${winnerVotes}/${totalVotes} phiếu bầu (${winPercent}%)`;
      } catch (e) {
        console.warn("Lỗi tính người thắng cuộc:", e);
      }
    } else {
      winnerBanner.classList.add("hidden");
    }

  } catch (err) {
    console.error("Lỗi khi tải dữ liệu từ Blockchain:", err);
  }
}

// Cập nhật Máy Trạng Thái & Timeline 3 bước
function updateWorkflowUI(status) {
  statusBadge.className = "status-pill";

  // Reset timeline classes
  [stepRegistering, stepVoting, stepEnded].forEach(s => s.className = "step-item");
  [connector1, connector2].forEach(c => c.className = "step-connector");

  if (status === 0) {
    statusBadge.textContent = "1. Đang Đăng Ký (Registering)";
    statusBadge.classList.add("status-registering");
    filterStatusText.textContent = "Giai đoạn Đăng ký (Chưa mở bình chọn)";
    
    stepRegistering.classList.add("active");
  } else if (status === 1) {
    statusBadge.textContent = "2. Đang Bỏ Phiếu (Voting Open)";
    statusBadge.classList.add("status-voting");
    filterStatusText.textContent = "Cổng bình chọn đang mở";

    stepRegistering.classList.add("completed");
    connector1.classList.add("completed");
    stepVoting.classList.add("active");
  } else if (status === 2) {
    statusBadge.textContent = "3. Đã Kết Thúc (Ended)";
    statusBadge.classList.add("status-ended");
    filterStatusText.textContent = "Hòm phiếu đã khóa";

    stepRegistering.classList.add("completed");
    connector1.classList.add("completed");
    stepVoting.classList.add("completed");
    connector2.classList.add("completed");
    stepEnded.classList.add("active", "completed");
  }
}

// Cập nhật Thẻ Cử Tri và Notice Bar
function updateVoterCardAndNotice(voterInfo, status) {
  voterCardAddress.textContent = `${currentAccount.substring(0, 8)}...${currentAccount.substring(36)}`;
  voterCardAddress.title = currentAccount;

  const isAdmin = currentAccount.toLowerCase() === contractAdmin.toLowerCase();

  // Đăng ký
  if (isAdmin) {
    voterCardRegistration.innerHTML = `<span class="badge-pill badge-neutral">Quản trị viên (Admin)</span>`;
  } else if (voterInfo.isRegistered) {
    voterCardRegistration.innerHTML = `<span class="badge-pill badge-success">Đã Cấp Quyền ✅</span>`;
  } else {
    voterCardRegistration.innerHTML = `<span class="badge-pill badge-danger">Chưa Cấp Quyền ❌</span>`;
  }

  // Bỏ phiếu
  if (voterInfo.hasVoted) {
    voterCardVoteStatus.innerHTML = `<span class="badge-pill badge-success">Đã Bầu (Ứng viên #${voterInfo.votedCandidateId}) 🎉</span>`;
  } else if (status === 1 && voterInfo.isRegistered) {
    voterCardVoteStatus.innerHTML = `<span class="badge-pill badge-neutral" style="color:#60a5fa;border:1px solid #3b82f6;">Chưa Bỏ Phiếu 🗳️</span>`;
  } else {
    voterCardVoteStatus.innerHTML = `<span class="badge-pill badge-neutral">Chưa Bỏ Phiếu</span>`;
  }

  // Notice Bar Text
  if (isAdmin) {
    voterStatusNotice.innerHTML = `
      <span class="notice-icon">⭐</span>
      <span class="notice-text">Bạn đang đăng nhập với tư cách <strong>Quản trị viên (Admin)</strong>. Bạn có toàn quyền thiết lập ứng viên, cấp quyền cử tri và điều hành kỳ bầu cử.</span>
    `;
  } else if (!voterInfo.isRegistered) {
    voterStatusNotice.innerHTML = `
      <span class="notice-icon">⚠️</span>
      <span class="notice-text">Địa chỉ ví của bạn <strong>chưa được cấp quyền</strong>. Vui lòng liên hệ Admin để thêm địa chỉ ví của bạn vào danh sách được phép bỏ phiếu.</span>
    `;
  } else if (voterInfo.hasVoted) {
    voterStatusNotice.innerHTML = `
      <span class="notice-icon">✅</span>
      <span class="notice-text">Bạn đã thực hiện bỏ phiếu thành công cho <strong>Ứng viên #${voterInfo.votedCandidateId}</strong>. Phiếu bầu đã được bảo chứng bất biến trên Blockchain!</span>
    `;
  } else if (status === 1) {
    voterStatusNotice.innerHTML = `
      <span class="notice-icon">🗳️</span>
      <span class="notice-text">Bạn đã được cấp quyền và đủ điều kiện bỏ phiếu! Hãy lựa chọn ứng cử viên tin tưởng bên dưới và bấm nút <strong>Bình Chọn</strong>.</span>
    `;
  } else if (status === 0) {
    voterStatusNotice.innerHTML = `
      <span class="notice-icon">⏳</span>
      <span class="notice-text">Ví của bạn đã được duyệt quyền! Vui lòng chờ Admin kích hoạt giai đoạn <strong>Bắt đầu bỏ phiếu</strong>.</span>
    `;
  } else {
    voterStatusNotice.innerHTML = `
      <span class="notice-icon">🔒</span>
      <span class="notice-text">Cuộc bầu cử đã kết thúc. Hòm phiếu đã được chốt và công bố kết quả chung cuộc.</span>
    `;
  }
}

// Cập nhật quyền trên các nút Admin
function updateAdminControls(status) {
  const isAdmin = currentAccount && contractAdmin && (currentAccount.toLowerCase() === contractAdmin.toLowerCase());

  if (!isAdmin) {
    candidateNameInput.disabled = true;
    addCandidateBtn.disabled = true;
    voterAddressInput.disabled = true;
    registerVoterBtn.disabled = true;
    startVotingBtn.disabled = true;
    endVotingBtn.disabled = true;
    return;
  }

  // Nếu là Admin
  if (status === 0) {
    candidateNameInput.disabled = false;
    addCandidateBtn.disabled = false;
    voterAddressInput.disabled = false;
    registerVoterBtn.disabled = false;
    startVotingBtn.disabled = false;
    endVotingBtn.disabled = true;
  } else if (status === 1) {
    candidateNameInput.disabled = true;
    addCandidateBtn.disabled = true;
    voterAddressInput.disabled = true;
    registerVoterBtn.disabled = true;
    startVotingBtn.disabled = true;
    endVotingBtn.disabled = false;
  } else {
    // Ended
    candidateNameInput.disabled = true;
    addCandidateBtn.disabled = true;
    voterAddressInput.disabled = true;
    registerVoterBtn.disabled = true;
    startVotingBtn.disabled = true;
    endVotingBtn.disabled = true;
  }
}

// 5.6 Render Danh Sách Thẻ Ứng Cử Viên kèm Thanh Phần Trăm (Percentage Bar)
function renderCandidates(candidates, status, totalVotes, highestVoteCount) {
  candidateList.innerHTML = "";

  if (candidates.length === 0) {
    candidateList.innerHTML = `
      <div class="empty-state">
        <p>Chưa có ứng viên nào được ghi nhận trên Blockchain.</p>
        <span class="subtext">Admin cần thêm ứng viên ở vòng Đăng ký.</span>
      </div>
    `;
    return;
  }

  candidates.forEach((cand) => {
    const card = document.createElement("div");
    card.className = "candidate-card";

    // Tính tỷ lệ phần trăm số phiếu
    const percentage = totalVotes > 0 ? ((cand.voteCount / totalVotes) * 100).toFixed(1) : 0;
    const isLeading = (highestVoteCount > 0 && cand.voteCount === highestVoteCount);
    const isWinnerCard = (status === 2 && isLeading);

    if (isWinnerCard) {
      card.classList.add("is-winner");
    }

    // Avatar chữ cái đầu
    const initial = cand.name.trim().charAt(0).toUpperCase() || "#";

    // Trạng thái nút bầu
    const canVote = (status === 1);
    let buttonText = "Bình Chọn";
    let buttonDisabled = !canVote;

    if (status === 0) buttonText = "Chưa Mở Bình Chọn";
    else if (status === 2) buttonText = "Đã Kết Thúc";

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

    // Gắn sự kiện mở Modal Xác Nhận Bỏ Phiếu
    const voteBtn = card.querySelector(".vote-btn");
    if (voteBtn && !buttonDisabled) {
      voteBtn.addEventListener("click", () => {
        openVoteModal(cand.id, cand.name);
      });
    }

    candidateList.appendChild(card);
  });
}

// ==============================================================================
// 6. XỬ LÝ MODAL XÁC NHẬN BỎ PHIẾU
// ==============================================================================
function openVoteModal(candidateId, candidateName) {
  if (!currentAccount) {
    showToast("Chưa kết nối ví", "Vui lòng bấm nút 'Kết Nối MetaMask' ở góc trên trước khi bình chọn!", "warning", 4000);
    return;
  }

  pendingVoteCandidateId = candidateId;
  modalCandBadge.textContent = `ỨNG CỬ VIÊN #${candidateId}`;
  modalCandidateName.textContent = candidateName;
  confirmModal.classList.remove("hidden");
}

function closeVoteModal() {
  confirmModal.classList.add("hidden");
  pendingVoteCandidateId = null;
}

cancelVoteBtn.addEventListener("click", closeVoteModal);
confirmModal.addEventListener("click", (e) => {
  if (e.target === confirmModal) closeVoteModal();
});

confirmVoteBtn.addEventListener("click", async () => {
  if (!pendingVoteCandidateId) return;
  const targetId = pendingVoteCandidateId;
  closeVoteModal();
  await executeVote(targetId);
});

// Thực hiện giao dịch bỏ phiếu trên Blockchain
async function executeVote(candidateId) {
  const txToast = showToast(
    "Đang gửi giao dịch",
    `Đang yêu cầu MetaMask ký phiếu bầu cho Ứng viên #${candidateId}...`,
    "loading",
    0
  );

  try {
    const tx = await votingContract.vote(candidateId);
    showToast("Đã phát sóng giao dịch", `Tx Hash: ${tx.hash.substring(0, 10)}... Đang chờ thợ đào đóng khối...`, "info", 5000);

    await tx.wait();

    removeToast(txToast);
    showToast("Bình chọn thành công!", `Phiếu bầu của bạn cho Ứng viên #${candidateId} đã được ghi nhận trên Blockchain!`, "success", 5000);
    await reloadData();

  } catch (err) {
    removeToast(txToast);
    console.error("Lỗi bỏ phiếu:", err);

    let errorReason = err.reason || err.message;
    if (err.code === "ACTION_REJECTED" || err.message?.includes("rejected")) {
      errorReason = "Bạn đã hủy giao dịch trên ví MetaMask.";
    }

    showToast("Bình chọn thất bại", errorReason, "error", 6000);
  }
}

// ==============================================================================
// 7. CÁC HÀM THAO TÁC CỦA ADMIN (VỚI TOAST NOTIFICATION)
// ==============================================================================
addCandidateBtn.addEventListener("click", async () => {
  const name = candidateNameInput.value.trim();
  if (!name) {
    showToast("Thiếu thông tin", "Vui lòng nhập họ và tên ứng cử viên!", "warning", 3500);
    return;
  }

  const txToast = showToast("Đang thêm ứng viên", `Đang gửi giao dịch thêm "${name}" lên Blockchain...`, "loading", 0);

  try {
    const tx = await votingContract.addCandidate(name);
    candidateNameInput.value = "";
    await tx.wait();

    removeToast(txToast);
    showToast("Thành công", `Đã thêm ứng cử viên "${name}" thành công!`, "success", 4000);
    await reloadData();
  } catch (err) {
    removeToast(txToast);
    showToast("Thêm ứng viên thất bại", err.reason || err.message, "error", 5000);
  }
});

registerVoterBtn.addEventListener("click", async () => {
  const addr = voterAddressInput.value.trim();
  if (!ethers.isAddress(addr)) {
    showToast("Địa chỉ không hợp lệ", "Địa chỉ ví Ethereum phải có định dạng 0x... (42 ký tự)!", "warning", 4000);
    return;
  }

  const txToast = showToast("Đang cấp quyền", `Đang ghi nhận quyền cử tri cho ${addr.substring(0, 8)}...`, "loading", 0);

  try {
    const tx = await votingContract.registerVoter(addr);
    voterAddressInput.value = "";
    await tx.wait();

    removeToast(txToast);
    showToast("Cấp quyền thành công", `Đã cấp quyền bỏ phiếu cho ví ${addr}!`, "success", 4500);
    await reloadData();
  } catch (err) {
    removeToast(txToast);
    showToast("Cấp quyền thất bại", err.reason || err.message, "error", 5000);
  }
});

startVotingBtn.addEventListener("click", async () => {
  const txToast = showToast("Đang mở hòm phiếu", "Đang chuyển trạng thái sang giai đoạn Bỏ Phiếu...", "loading", 0);

  try {
    const tx = await votingContract.startVoting();
    await tx.wait();

    removeToast(txToast);
    showToast("Bắt đầu bỏ phiếu", "Cuộc bình chọn đã chính thức BẮT ĐẦU! Cử tri có thể bỏ phiếu ngay bây giờ.", "success", 5000);
    await reloadData();
  } catch (err) {
    removeToast(txToast);
    showToast("Lỗi mở cuộc bình chọn", err.reason || err.message, "error", 5000);
  }
});

endVotingBtn.addEventListener("click", async () => {
  const txToast = showToast("Đang đóng hòm phiếu", "Đang khóa hòm phiếu và chuyển sang giai đoạn Kết Thúc...", "loading", 0);

  try {
    const tx = await votingContract.endVoting();
    await tx.wait();

    removeToast(txToast);
    showToast("Bầu cử kết thúc", "Cuộc bình chọn đã chính thức KHÓA SỔ! Kết quả đã được công bố trên bảng vinh danh.", "success", 5000);
    await reloadData();
  } catch (err) {
    removeToast(txToast);
    showToast("Lỗi đóng cuộc bình chọn", err.reason || err.message, "error", 5000);
  }
});

// ==============================================================================
// 8. TIỆN ÍCH PHỤ TRỢ (COPY ĐỊA CHỈ, LÀM MỚI, LẮNG NGHE METAMASK)
// ==============================================================================
copyAddressBtn.addEventListener("click", () => {
  if (!currentAccount) return;
  navigator.clipboard.writeText(currentAccount).then(() => {
    showToast("Đã sao chép", "Đã chép địa chỉ ví vào Clipboard!", "info", 2500);
  });
});

userAccountSpan.addEventListener("click", () => {
  if (!currentAccount) return;
  navigator.clipboard.writeText(currentAccount).then(() => {
    showToast("Đã sao chép", "Đã chép địa chỉ ví vào Clipboard!", "info", 2500);
  });
});

refreshDataBtn.addEventListener("click", async () => {
  if (!votingContract) {
    showToast("Thông báo", "Vui lòng kết nối ví MetaMask trước!", "info", 2500);
    return;
  }
  showToast("Đang làm mới", "Đang truy vấn dữ liệu mới nhất từ Blockchain...", "info", 1500);
  await reloadData();
});

connectWalletBtn.addEventListener("click", connectWallet);

if (typeof window !== "undefined" && window.ethereum) {
  window.ethereum.on("accountsChanged", (accounts) => {
    console.log("[MetaMask] Tài khoản đã thay đổi:", accounts);
    window.location.reload();
  });

  window.ethereum.on("chainChanged", (chainId) => {
    console.log("[MetaMask] Mạng đã thay đổi:", chainId);
    window.location.reload();
  });
}

// Khởi chạy nạp file cấu hình khi trang tải xong
loadConfig();
