// ==============================================================================
// DỰ ÁN BÌNH CHỌN BLOCKCHAIN - PHÂN HỆ FRONTEND & WEB3
// - THÀNH VIÊN 2: Tầng Web3 Middleware, Tích hợp Ethers.js & Xử lý Giao dịch
// - THÀNH VIÊN 3: Tầng DOM Rendering, Giao diện Trải nghiệm Người dùng & Tương tác
// ==============================================================================

// Địa chỉ Contract mặc định (sẽ được cập nhật sau khi chạy script deploy)
let CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

// ABI của Smart Contract Voting (Đã đối chiếu và đồng bộ đầy đủ theo Phase 2)
// Bao gồm: Các hàm Đọc (view), Các hàm Ghi (transaction), và 4 Sự kiện (Events)
const CONTRACT_ABI = [
  // --- CÁC HÀM ĐỌC DỮ LIỆU (VIEW / CALL - Miễn phí Gas) ---
  "function admin() view returns (address)",
  "function electionName() view returns (string)",
  "function currentStatus() view returns (uint8)",
  "function totalVotes() view returns (uint256)",
  "function getCandidates() view returns (tuple(uint256 id, string name, uint256 voteCount)[])",
  "function getCandidatesCount() view returns (uint256)",
  "function voters(address) view returns (bool isRegistered, bool hasVoted, uint256 votedCandidateId)",
  "function getWinner() view returns (string winnerName, uint256 highestVote)",

  // --- CÁC HÀM GHI DỮ LIỆU (TRANSACTIONS - Cần ví MetaMask ký và tốn Gas) ---
  "function addCandidate(string _name)",
  "function registerVoter(address _voter)",
  "function startVoting()",
  "function endVoting()",
  "function vote(uint256 _candidateId)",

  // --- CÁC SỰ KIỆN (EVENTS - Hỗ trợ Web3 bắt tín hiệu thời gian thực) ---
  "event CandidateAdded(uint256 indexed candidateId, string name)",
  "event VoterRegistered(address indexed voterAddress)",
  "event StatusChanged(uint8 previousStatus, uint8 newStatus)",
  "event VoteCasted(address indexed voter, uint256 indexed candidateId)"
];

// Khởi tạo các biến toàn cục
let provider;
let signer;
let votingContract;
let currentAccount = null;
let contractAdmin = null;

// Tham chiếu các phần tử DOM trên giao diện
const connectWalletBtn = document.getElementById("connectWalletBtn");
const walletInfo = document.getElementById("walletInfo");
const userAccountSpan = document.getElementById("userAccount");
const userRoleSpan = document.getElementById("userRole");
const electionTitleH1 = document.getElementById("electionTitle");
const statusBadge = document.getElementById("statusBadge");
const totalCandidatesCount = document.getElementById("totalCandidatesCount");
const totalVotesCount = document.getElementById("totalVotesCount");
const candidateList = document.getElementById("candidateList");
const voterStatusNotice = document.getElementById("voterStatusNotice");
const winnerBanner = document.getElementById("winnerBanner");
const winnerText = document.getElementById("winnerText");

// Input & Button Quản trị
const candidateNameInput = document.getElementById("candidateNameInput");
const addCandidateBtn = document.getElementById("addCandidateBtn");
const voterAddressInput = document.getElementById("voterAddressInput");
const registerVoterBtn = document.getElementById("registerVoterBtn");
const startVotingBtn = document.getElementById("startVotingBtn");
const endVotingBtn = document.getElementById("endVotingBtn");

let dynamicAbi = null;

// 1. Tự động nạp file cấu hình contract-config.json nếu có
async function loadConfig() {
  try {
    const res = await fetch("contract-config.json");
    if (res.ok) {
      const data = await res.json();
      if (data.address) {
        CONTRACT_ADDRESS = data.address;
        console.log("Đã tải địa chỉ Contract từ config:", CONTRACT_ADDRESS);
      }
      if (data.abi && Array.isArray(data.abi) && data.abi.length > 0) {
        dynamicAbi = data.abi;
        console.log("Đã tải toàn bộ ABI từ config thành công!");
      }
    }
  } catch (err) {
    console.log("Sử dụng cấu hình Contract mặc định.");
  }
}

// 2. Kết nối ví MetaMask & Kiểm tra mạng Localhost
async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    alert("Vui lòng cài đặt tiện ích MetaMask trên trình duyệt!");
    return;
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);

    // Kiểm tra và yêu cầu đổi sang mạng Hardhat Localhost (Chain ID: 31337 / Hex: 0x7a69)
    const network = await provider.getNetwork();
    if (network.chainId !== 31337n) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x7a69" }]
        });
      } catch (switchError) {
        // Mã lỗi 4902: Mạng chưa được thêm vào MetaMask -> Yêu cầu thêm mạng
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
      // Tạo lại provider sau khi đổi mạng
      provider = new ethers.BrowserProvider(window.ethereum);
    }

    signer = await provider.getSigner();
    currentAccount = await signer.getAddress();

    // Hiển thị thông tin ví
    userAccountSpan.textContent = `${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`;
    connectWalletBtn.classList.add("hidden");
    walletInfo.classList.remove("hidden");

    // Khởi tạo Contract Object
    const activeAbi = dynamicAbi || CONTRACT_ABI;
    votingContract = new ethers.Contract(CONTRACT_ADDRESS, activeAbi, signer);

    // Kích hoạt lắng nghe sự kiện On-Chain thời gian thực
    setupContractEvents();

    // Lấy thông tin admin
    contractAdmin = await votingContract.admin();
    if (contractAdmin.toLowerCase() === currentAccount.toLowerCase()) {
      userRoleSpan.textContent = "Admin";
      userRoleSpan.style.backgroundColor = "#e11d48";
    } else {
      userRoleSpan.textContent = "Cử tri";
      userRoleSpan.style.backgroundColor = "#2563eb";
    }

    // Tải dữ liệu từ Blockchain
    await reloadData();

  } catch (error) {
    console.error("Lỗi khi kết nối ví:", error);
    alert("Không thể kết nối với MetaMask: " + (error.message || error));
  }
}

// Thiết lập lắng nghe sự kiện On-Chain thời gian thực (Real-time Events)
function setupContractEvents() {
  if (!votingContract) return;

  // Hủy lắng nghe cũ để tránh trùng lặp
  votingContract.removeAllListeners();

  // 1. Khi có người bỏ phiếu
  votingContract.on("VoteCasted", (voter, candidateId) => {
    console.log(`[SỰ KIỆN ON-CHAIN] Cử tri ${voter} đã bỏ phiếu cho ứng viên #${candidateId}`);
    reloadData();
  });

  // 2. Khi Admin thêm ứng viên mới
  votingContract.on("CandidateAdded", (candidateId, name) => {
    console.log(`[SỰ KIỆN ON-CHAIN] Đã thêm ứng viên: ${name} (ID: #${candidateId})`);
    reloadData();
  });

  // 3. Khi Admin cấp quyền cử tri
  votingContract.on("VoterRegistered", (voterAddress) => {
    console.log(`[SỰ KIỆN ON-CHAIN] Cấp quyền cho cử tri: ${voterAddress}`);
    reloadData();
  });

  // 4. Khi trạng thái cuộc bầu cử thay đổi
  votingContract.on("StatusChanged", (prevStatus, newStatus) => {
    console.log(`[SỰ KIỆN ON-CHAIN] Thay đổi trạng thái: ${prevStatus} -> ${newStatus}`);
    reloadData();
  });
}

// 3. Tải và đồng bộ toàn bộ dữ liệu từ Smart Contract
async function reloadData() {
  if (!votingContract) return;

  try {
    // 3.1 Tên cuộc bầu cử & Trạng thái
    const title = await votingContract.electionName();
    const status = await votingContract.currentStatus();
    const totalVotes = await votingContract.totalVotes();

    electionTitleH1.textContent = title;
    totalVotesCount.textContent = totalVotes.toString();

    // Cập nhật trạng thái
    updateStatusBadge(Number(status));

    // 3.2 Lấy danh sách ứng viên
    const candidates = await votingContract.getCandidates();
    totalCandidatesCount.textContent = candidates.length.toString();
    renderCandidates(candidates, Number(status));

    // 3.3 Kiểm tra trạng thái của cử tri hiện tại
    const voterInfo = await votingContract.voters(currentAccount);
    updateVoterNotice(voterInfo, Number(status));

    // 3.4 Nếu đã kết thúc, hiển thị người chiến thắng
    if (Number(status) === 2) {
      try {
        const winner = await votingContract.getWinner();
        winnerBanner.classList.remove("hidden");
        winnerText.textContent = `Ứng viên "${winner[0]}" với tổng số ${winner[1]} phiếu bầu!`;
      } catch (e) {
        console.warn("Chưa có kết quả hoặc lỗi tính:", e);
      }
    } else {
      winnerBanner.classList.add("hidden");
    }

  } catch (err) {
    console.error("Lỗi khi đọc dữ liệu Smart Contract:", err);
  }
}

// Cập nhật hiển thị Trạng thái (Pill)
function updateStatusBadge(status) {
  statusBadge.className = "status-pill";
  if (status === 0) {
    statusBadge.textContent = "Đang Đăng Ký (Registering)";
    statusBadge.classList.add("status-registering");
  } else if (status === 1) {
    statusBadge.textContent = "Đang Bỏ Phiếu (Voting Open)";
    statusBadge.classList.add("status-voting");
  } else if (status === 2) {
    statusBadge.textContent = "Đã Kết Thúc (Ended)";
    statusBadge.classList.add("status-ended");
  }
}

// Hiển thị thông báo quyền cử tri
function updateVoterNotice(voterInfo, status) {
  if (currentAccount.toLowerCase() === contractAdmin.toLowerCase()) {
    voterStatusNotice.innerHTML = `⭐ Bạn là <strong>Quản trị viên (Admin)</strong> của cuộc bầu cử này.`;
    return;
  }

  if (!voterInfo.isRegistered) {
    voterStatusNotice.innerHTML = `⚠️ Địa chỉ ví của bạn <strong>chưa được cấp quyền</strong> bỏ phiếu bởi Quản trị viên.`;
  } else if (voterInfo.hasVoted) {
    voterStatusNotice.innerHTML = `✅ Bạn <strong>đã hoàn thành</strong> việc bỏ phiếu (Ứng viên ID: #${voterInfo.votedCandidateId}). Cảm ơn bạn!`;
  } else if (status === 1) {
    voterStatusNotice.innerHTML = `🗳️ Bạn <strong>đủ điều kiện</strong> bỏ phiếu! Hãy chọn ứng cử viên yêu thích bên dưới.`;
  } else {
    voterStatusNotice.innerHTML = `⏳ Bạn đã được cấp quyền, vui lòng chờ Admin mở cổng bình chọn.`;
  }
}

// Hiển thị danh sách thẻ ứng viên
function renderCandidates(candidates, status) {
  candidateList.innerHTML = "";

  if (candidates.length === 0) {
    candidateList.innerHTML = `<div class="empty-state">Chưa có ứng viên nào được thêm vào danh sách.</div>`;
    return;
  }

  candidates.forEach((cand) => {
    const card = document.createElement("div");
    card.className = "candidate-card";

    const canVote = (status === 1);

    card.innerHTML = `
      <div>
        <span class="candidate-badge">ỨNG CỬ VIÊN #${cand.id}</span>
        <h4 class="candidate-name">${cand.name}</h4>
        <div class="candidate-votes">Số phiếu hiện tại: <strong>${cand.voteCount}</strong></div>
      </div>
      <button 
        class="btn btn-primary full-width vote-btn" 
        data-id="${cand.id}"
        ${!canVote ? "disabled style='opacity: 0.5; cursor: not-allowed;'" : ""}
      >
        Bình Chọn
      </button>
    `;

    // Bắt sự kiện bấm nút bỏ phiếu
    const voteBtn = card.querySelector(".vote-btn");
    voteBtn.addEventListener("click", () => handleVote(cand.id));

    candidateList.appendChild(card);
  });
}

// 4. Xử lý chức năng bỏ phiếu (Dành cho cử tri)
async function handleVote(candidateId) {
  try {
    const tx = await votingContract.vote(candidateId);
    alert("Giao dịch đã gửi lên Blockchain! Vui lòng chờ xác nhận...");
    await tx.wait();
    alert("Bình chọn thành công!");
    await reloadData();
  } catch (err) {
    console.error(err);
    alert("Thất bại: " + (err.reason || err.message));
  }
}

// 5. Các hàm thao tác của Admin
addCandidateBtn.addEventListener("click", async () => {
  const name = candidateNameInput.value.trim();
  if (!name) return alert("Vui lòng nhập tên ứng viên!");

  try {
    const tx = await votingContract.addCandidate(name);
    candidateNameInput.value = "";
    await tx.wait();
    alert("Đã thêm ứng viên thành công!");
    await reloadData();
  } catch (err) {
    alert("Lỗi: " + (err.reason || err.message));
  }
});

registerVoterBtn.addEventListener("click", async () => {
  const addr = voterAddressInput.value.trim();
  if (!ethers.isAddress(addr)) return alert("Địa chỉ ví không đúng định dạng!");

  try {
    const tx = await votingContract.registerVoter(addr);
    voterAddressInput.value = "";
    await tx.wait();
    alert("Đã cấp quyền bỏ phiếu thành công cho: " + addr);
    await reloadData();
  } catch (err) {
    alert("Lỗi: " + (err.reason || err.message));
  }
});

startVotingBtn.addEventListener("click", async () => {
  try {
    const tx = await votingContract.startVoting();
    await tx.wait();
    alert("Cuộc bỏ phiếu đã chính thức BẮT ĐẦU!");
    await reloadData();
  } catch (err) {
    alert("Lỗi: " + (err.reason || err.message));
  }
});

endVotingBtn.addEventListener("click", async () => {
  try {
    const tx = await votingContract.endVoting();
    await tx.wait();
    alert("Cuộc bỏ phiếu đã KẾT THÚC! Đã khóa phiếu bầu.");
    await reloadData();
  } catch (err) {
    alert("Lỗi: " + (err.reason || err.message));
  }
});

// Sự kiện lắng nghe ví
connectWalletBtn.addEventListener("click", connectWallet);

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}

// Khởi chạy
loadConfig();
