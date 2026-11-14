// ==============================================================================
// DỰ ÁN BÌNH CHỌN BLOCKCHAIN (DAPP)
// PHÂN HỆ: WEB3 MIDDLEWARE & GIAO TIẾP BLOCKCHAIN
// TÁC GIẢ CHỊU TRÁCH NHIỆM: THÀNH VIÊN 2 (Web3 Middleware & Deployment Engineer)
// PHASE 8: Cài đặt cơ chế autoConnect tự động khôi phục kết nối ví khi F5
// ==============================================================================

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.currentAccount = null;
    this.contractAddress = "0xE450503ff95CFbeE1636C6136CC169B7143c382F";
    this.contractAdmin = "0xaf9F37f8c2718bc71aD15dc0e67247C99f698C0d";
    this.chainId = 11155111n; // Mặc định chuyển sang Sepolia Testnet
    this.targetNetwork = "sepolia";
    this.abi = null;
    this.isConnecting = false;

    // Cấu hình các mạng Blockchain hỗ trợ (Localhost & Sepolia Testnets)
    this.SUPPORTED_NETWORKS = {
      "11155111": {
        chainIdHex: "0xaa36a7",
        chainName: "Ethereum Sepolia Testnet",
        rpcUrls: ["https://rpc.sepolia.org", "https://ethereum-sepolia-rpc.publicnode.com"],
        nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://sepolia.etherscan.io"]
      },
      "1301": {
        chainIdHex: "0x515",
        chainName: "Unichain Sepolia Testnet",
        rpcUrls: ["https://sepolia.unichain.org"],
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://sepolia.uniscan.xyz"]
      },
      "31337": {
        chainIdHex: "0x7a69",
        chainName: "Hardhat Localhost",
        rpcUrls: ["http://127.0.0.1:8545"],
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: null
      }
    };

    // ABI dự phòng nếu chưa nạp được file config
    this.FALLBACK_ABI = [
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
  }

  /**
   * Tải cấu hình hợp đồng từ contract-config.json (xuất tự động từ deploy hoặc Remix)
   */
  async loadConfig() {
    try {
      const res = await fetch(`contract-config.json?v=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.address) this.contractAddress = data.address;
        if (data.chainId) this.chainId = BigInt(data.chainId);
        if (data.network) this.targetNetwork = data.network;
        if (data.adminAddress) this.contractAdmin = data.adminAddress;
        if (Array.isArray(data.abi) && data.abi.length > 0) {
          this.abi = data.abi;
        }
        console.log(`[Web3Service] Đã tải config: Contract ${this.contractAddress} | Mạng: ${this.targetNetwork} (ChainID: ${this.chainId})`);
      }
    } catch (e) {
      console.warn("[Web3Service] Sử dụng cấu hình mặc định (fallback):", e.message);
    }
  }

  /**
   * Kiểm tra điều kiện tiên quyết trước khi kết nối ví
   */
  checkPrerequisites() {
    if (window.location.protocol === "file:") {
      throw new Error("PROTOCOL_FILE_NOT_ALLOWED");
    }
    if (typeof window.ethereum === "undefined") {
      throw new Error("METAMASK_NOT_INSTALLED");
    }
  }

  /**
   * Kết nối ví MetaMask và đồng bộ mạng (Sepolia hoặc Localhost)
   */
  async connect() {
    this.checkPrerequisites();
    if (this.isConnecting) return null;
    this.isConnecting = true;

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      this.provider = new ethers.BrowserProvider(window.ethereum);

      // Đảm bảo và tự động nhận diện mạng ví (ưu tiên Sepolia Testnet)
      await this.ensureCorrectNetwork();

      this.signer = await this.provider.getSigner();
      this.currentAccount = await this.signer.getAddress();

      // Khởi tạo Smart Contract Instance
      const activeAbi = this.abi || this.FALLBACK_ABI;
      this.contract = new ethers.Contract(this.contractAddress, activeAbi, this.signer);

      // Tra cứu địa chỉ Admin từ hợp đồng hoặc cấu hình
      try {
        const onChainAdmin = await this.contract.admin();
        if (onChainAdmin && onChainAdmin !== ethers.ZeroAddress) {
          this.contractAdmin = onChainAdmin;
        }
      } catch (err) {
        console.warn("[Web3Service] Đọc admin từ config/fallback:", this.contractAdmin);
      }

      const isAdmin = this.contractAdmin
        ? this.contractAdmin.toLowerCase() === this.currentAccount.toLowerCase()
        : false;

      this.isConnecting = false;
      return {
        account: this.currentAccount,
        admin: this.contractAdmin,
        isAdmin: isAdmin,
        chainId: this.chainId.toString(),
        networkName: this.getNetworkName()
      };
    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * PHASE 8: Cài đặt cơ chế autoConnect tự động khôi phục kết nối ví khi F5
   * Sử dụng phương thức eth_accounts không xâm lấn (non-intrusive) để kiểm tra phiên kết nối cũ
   * Tránh bật popup MetaMask gây phiền hà nếu người dùng chưa từng cấp quyền
   */
  async autoConnect() {
    if (typeof window.ethereum === "undefined" || window.location.protocol === "file:") {
      return null;
    }
    try {
      console.log("[Web3Service - Phase 8] Đang kiểm tra phiên kết nối ví đã lưu...");
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts && accounts.length > 0) {
        console.log(`[Web3Service - Phase 8] Tìm thấy phiên ví hợp lệ: ${accounts[0]}. Đang tự động kết nối...`);
        return await this.connect();
      } else {
        console.log("[Web3Service - Phase 8] Không có phiên ví nào được cấp quyền trước đó.");
      }
    } catch (err) {
      console.warn("[Web3Service - Phase 8] Lỗi khi tự động khôi phục kết nối ví:", err.message);
    }
    return null;
  }

  /**
   * PHASE 4: Cơ chế tự động nhận diện & chuyển mạng thông minh (Sepolia / Localhost)
   */
  async ensureCorrectNetwork() {
    const currentNetwork = await this.provider.getNetwork();
    const currentChainId = currentNetwork.chainId;

    // 1. Nếu ví người dùng đã ở một trong các mạng hỗ trợ (Sepolia 11155111, Unichain 1301, Localhost 31337)
    // Hệ thống tự động nhận diện và thích ứng mà không báo lỗi!
    if (this.SUPPORTED_NETWORKS[currentChainId.toString()]) {
      this.chainId = currentChainId;
      console.log(`[Web3Service] Đã nhận diện mạng ví: ${this.getNetworkName()} (ChainID: ${currentChainId})`);
      return;
    }

    // 2. Nếu ví đang ở mạng khác (Mainnet, Polygon...), tự động yêu cầu chuyển sang Sepolia Testnet
    const targetChainIdStr = this.chainId ? this.chainId.toString() : "11155111";
    const netConfig = this.SUPPORTED_NETWORKS[targetChainIdStr] || this.SUPPORTED_NETWORKS["11155111"];

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: netConfig.chainIdHex }]
      });
      this.chainId = BigInt(netConfig.chainIdHex);
      this.provider = new ethers.BrowserProvider(window.ethereum);
    } catch (switchError) {
      // Mã 4902: Mạng chưa có trên MetaMask -> Thêm mạng tự động
      if (switchError.code === 4902) {
        const addParams = {
          chainId: netConfig.chainIdHex,
          chainName: netConfig.chainName,
          rpcUrls: netConfig.rpcUrls,
          nativeCurrency: netConfig.nativeCurrency
        };
        if (netConfig.blockExplorerUrls) {
          addParams.blockExplorerUrls = netConfig.blockExplorerUrls;
        }
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [addParams]
        });
        this.chainId = BigInt(netConfig.chainIdHex);
        this.provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Lấy tên hiển thị của mạng hiện tại
   */
  getNetworkName() {
    const chainIdStr = this.chainId.toString();
    const net = this.SUPPORTED_NETWORKS[chainIdStr];
    return net ? net.chainName : `ChainID ${chainIdStr}`;
  }

  /**
   * Truy vấn dữ liệu an toàn từ Blockchain (có xử lý fallback nếu hợp đồng đang chờ deploy)
   */
  async fetchElectionData() {
    if (!this.contract) throw new Error("Chưa kết nối hợp đồng thông minh!");

    let title = "Bầu cử Ban Cán Sự Khóa 2026";
    let status = 0;
    let totalVotes = 0;
    let candidates = [
      { id: 1, name: "Nguyễn Văn A (Ủy Viên Ban Chấp Hành)", voteCount: 0 },
      { id: 2, name: "Trần Thị B (Trưởng Ban Truyền Thông)", voteCount: 0 },
      { id: 3, name: "Lê Văn C (Đội Trưởng Nghiên Cứu)", voteCount: 0 }
    ];
    let highestVote = 0;
    let winner = null;

    // Kiểm tra xem contract đã có mã bytecode thực tế trên mạng hiện tại chưa
    try {
      const code = await this.provider.getCode(this.contractAddress);
      if (code && code !== "0x") {
        const [onChainTitle, statusRaw, totalVotesRaw, rawCandidates] = await Promise.all([
          this.contract.electionName(),
          this.contract.currentStatus(),
          this.contract.totalVotes(),
          this.contract.getCandidates()
        ]);

        title = onChainTitle;
        status = Number(statusRaw);
        totalVotes = Number(totalVotesRaw);

        candidates = rawCandidates.map(c => {
          const vCount = Number(c.voteCount);
          if (vCount > highestVote) highestVote = vCount;
          return {
            id: Number(c.id),
            name: c.name,
            voteCount: vCount
          };
        });

        if (status === 2) {
          try {
            const winRes = await this.contract.getWinner();
            winner = { name: winRes[0], voteCount: Number(winRes[1]) };
          } catch (e) {
            console.warn("[Web3Service] Lỗi getWinner:", e);
          }
        }
      } else {
        console.log("[Web3Service] Hợp đồng đang ở trạng thái chuẩn bị khởi tạo.");
      }
    } catch (readErr) {
      console.warn("[Web3Service] Sử dụng dữ liệu khởi tạo:", readErr.message);
    }

    // Thông tin cử tri hiện tại
    let voterInfo = { isRegistered: true, hasVoted: false, votedCandidateId: 0 };
    if (this.currentAccount) {
      try {
        const code = await this.provider.getCode(this.contractAddress);
        if (code && code !== "0x") {
          const v = await this.contract.voters(this.currentAccount);
          voterInfo = {
            isRegistered: Boolean(v.isRegistered),
            hasVoted: Boolean(v.hasVoted),
            votedCandidateId: Number(v.votedCandidateId)
          };
        }
      } catch (e) {
        console.warn("[Web3Service] Không đọc được cử tri on-chain, dùng mặc định:", e);
      }
    }

    const isAdmin = this.contractAdmin && this.currentAccount
      ? this.contractAdmin.toLowerCase() === this.currentAccount.toLowerCase()
      : false;

    return {
      title,
      status,
      totalVotes,
      candidates,
      highestVote,
      voterInfo,
      winner,
      isAdmin,
      contractAddress: this.contractAddress,
      currentAccount: this.currentAccount
    };
  }

  // ==============================================================================
  // PHASE 5: CÁC PHƯƠNG THỨC GIAO DỊCH ON-CHAIN (TRANSACTION WRAPPERS)
  // ==============================================================================

  /**
   * Kiểm tra xem địa chỉ hợp đồng đã thực sự có mã bytecode trên mạng đang kết nối chưa
   */
  async ensureContractReady() {
    if (!this.contract) throw new Error("Chưa kết nối ví!");
    if (!this.provider || !this.contractAddress) return;
    try {
      const code = await this.provider.getCode(this.contractAddress);
      if (!code || code === "0x") {
        throw new Error("CONTRACT_NOT_DEPLOYED_ON_NETWORK");
      }
    } catch (err) {
      if (err.message === "CONTRACT_NOT_DEPLOYED_ON_NETWORK") {
        throw err;
      }
      console.warn("[Web3Service] Cảnh báo kiểm tra bytecode contract:", err.message);
    }
  }

  /**
   * Phương thức: Bỏ phiếu cho một ứng cử viên (Cử tri thực hiện)
   * @param {number} candidateId - Mã định danh của ứng viên (1, 2, 3...)
   */
  async vote(candidateId) {
    await this.ensureContractReady();
    if (!candidateId || candidateId <= 0) {
      throw new Error("Mã ứng viên không hợp lệ!");
    }
    console.log(`[Web3Service - Phase 5] Bắt đầu gửi giao dịch bỏ phiếu cho Ứng viên #${candidateId}...`);
    const tx = await this.contract.vote(candidateId);
    console.log(`[Web3Service - Phase 5] Giao dịch đã phát sóng (TxHash: ${tx.hash}). Đang đợi đóng khối...`);
    const receipt = await tx.wait();
    console.log(`[Web3Service - Phase 5] Giao dịch thành công tại Block #${receipt.blockNumber}!`);
    return { txHash: tx.hash, receipt, blockNumber: receipt.blockNumber };
  }

  /**
   * Phương thức Admin: Thêm ứng viên mới vào danh sách
   * @param {string} name - Họ và tên ứng cử viên
   */
  async addCandidate(name) {
    await this.ensureContractReady();
    const trimmed = (name || "").trim();
    if (!trimmed) {
      throw new Error("Tên ứng cử viên không được để trống!");
    }
    console.log(`[Web3Service - Phase 5] Admin gửi giao dịch thêm ứng viên: "${trimmed}"...`);
    const tx = await this.contract.addCandidate(trimmed);
    console.log(`[Web3Service - Phase 5] Đã phát sóng Tx: ${tx.hash}. Đang đợi xác nhận...`);
    const receipt = await tx.wait();
    return { txHash: tx.hash, receipt, blockNumber: receipt.blockNumber };
  }

  /**
   * Phương thức Admin: Cấp quyền cử tri (Whitelist địa chỉ ví)
   * @param {string} voterAddress - Địa chỉ ví Ethereum (0x...)
   */
  async registerVoter(voterAddress) {
    await this.ensureContractReady();
    const addr = (voterAddress || "").trim();
    if (!ethers.isAddress(addr)) {
      throw new Error("Địa chỉ ví Ethereum không hợp lệ (phải có dạng 0x... 42 ký tự)!");
    }
    console.log(`[Web3Service - Phase 5] Admin gửi giao dịch cấp quyền cho ví: ${addr}...`);
    const tx = await this.contract.registerVoter(addr);
    console.log(`[Web3Service - Phase 5] Đã phát sóng Tx: ${tx.hash}. Đang đợi xác nhận...`);
    const receipt = await tx.wait();
    return { txHash: tx.hash, receipt, blockNumber: receipt.blockNumber };
  }

  /**
   * Phương thức Admin: Mở hòm phiếu (chuyển sang Voting)
   */
  async startVoting() {
    await this.ensureContractReady();
    try {
      const count = await this.contract.getCandidatesCount();
      if (Number(count) < 2) {
        throw new Error("Chưa đủ điều kiện: Cần có ít nhất 2 ứng cử viên trên Blockchain để mở hòm phiếu! Vui lòng thêm ứng cử viên trước.");
      }
    } catch (checkErr) {
      if (checkErr.message.includes("ít nhất 2 ứng cử viên")) {
        throw checkErr;
      }
    }
    console.log("[Web3Service - Phase 5] Admin gửi giao dịch mở hòm phiếu (startVoting)...");
    const tx = await this.contract.startVoting();
    console.log(`[Web3Service - Phase 5] Đã phát sóng Tx: ${tx.hash}. Đang đợi xác nhận...`);
    const receipt = await tx.wait();
    return { txHash: tx.hash, receipt, blockNumber: receipt.blockNumber };
  }

  /**
   * Phương thức Admin: Đóng hòm phiếu vĩnh viễn (chuyển sang Ended)
   */
  async endVoting() {
    await this.ensureContractReady();
    console.log("[Web3Service - Phase 5] Admin gửi giao dịch đóng hòm phiếu (endVoting)...");
    const tx = await this.contract.endVoting();
    console.log(`[Web3Service - Phase 5] Đã phát sóng Tx: ${tx.hash}. Đang đợi xác nhận...`);
    const receipt = await tx.wait();
    return { txHash: tx.hash, receipt, blockNumber: receipt.blockNumber };
  }

  /**
   * PHASE 6: Thiết lập 4 trình lắng nghe sự kiện On-Chain thời gian thực từ EVM
   * Tự động làm mới dữ liệu và cập nhật giao diện mà không cần F5
   * @param {Object} callbacks - Tập hợp các hàm xử lý callback
   * @param {Function} callbacks.onVoteCasted - Callback khi cử tri bỏ phiếu
   * @param {Function} callbacks.onCandidateAdded - Callback khi có ứng cử viên mới
   * @param {Function} callbacks.onVoterRegistered - Callback khi cử tri được cấp quyền
   * @param {Function} callbacks.onStatusChanged - Callback khi thay đổi giai đoạn bầu cử
   */
  setupEventListeners(callbacks = {}) {
    if (!this.contract) {
      console.warn("[Web3Service - Phase 6] Không thể gắn event listeners: Hợp đồng chưa được khởi tạo!");
      return;
    }

    try {
      // 1. Dọn dẹp các listeners cũ để tránh trùng lặp memory leak
      this.contract.removeAllListeners();
      this.activeCallbacks = callbacks;

      console.log("[Web3Service - Phase 6] Bắt đầu kích hoạt 4 trình lắng nghe sự kiện EVM...");

      // 2. Sự kiện 1: VoteCasted (Cử tri bỏ phiếu)
      this.contract.on("VoteCasted", (voter, candidateId, event) => {
        const cId = Number(candidateId);
        console.log(`[EVM Event - VoteCasted] Cử tri ${voter} đã bỏ phiếu cho ứng viên #${cId}`);
        if (callbacks.onVoteCasted) {
          callbacks.onVoteCasted(voter, cId, event);
        }
        this._dispatchWeb3Event("VoteCasted", { voter, candidateId: cId, event });
      });

      // 3. Sự kiện 2: CandidateAdded (Thêm ứng cử viên)
      this.contract.on("CandidateAdded", (candidateId, name, event) => {
        const cId = Number(candidateId);
        console.log(`[EVM Event - CandidateAdded] Ghi danh ứng cử viên: "${name}" (Mã #${cId})`);
        if (callbacks.onCandidateAdded) {
          callbacks.onCandidateAdded(cId, name, event);
        }
        this._dispatchWeb3Event("CandidateAdded", { candidateId: cId, name, event });
      });

      // 4. Sự kiện 3: VoterRegistered (Cấp quyền cử tri)
      this.contract.on("VoterRegistered", (voterAddress, event) => {
        console.log(`[EVM Event - VoterRegistered] Cấp quyền bỏ phiếu thành công cho ví: ${voterAddress}`);
        if (callbacks.onVoterRegistered) {
          callbacks.onVoterRegistered(voterAddress, event);
        }
        this._dispatchWeb3Event("VoterRegistered", { voterAddress, event });
      });

      // 5. Sự kiện 4: StatusChanged (Thay đổi giai đoạn bầu cử)
      this.contract.on("StatusChanged", (prevStatus, newStatus, event) => {
        const prev = Number(prevStatus);
        const next = Number(newStatus);
        console.log(`[EVM Event - StatusChanged] Giai đoạn thay đổi: ${prev} -> ${next}`);
        if (callbacks.onStatusChanged) {
          callbacks.onStatusChanged(prev, next, event);
        }
        this._dispatchWeb3Event("StatusChanged", { prevStatus: prev, newStatus: next, event });
      });

      console.log("[Web3Service - Phase 6] 4 trình lắng nghe sự kiện EVM đã sẵn sàng hoạt động!");
    } catch (e) {
      console.warn("[Web3Service - Phase 6] Lỗi khi thiết lập event listeners:", e.message);
    }
  }

  /**
   * Hủy đăng ký toàn bộ sự kiện On-Chain (Dọn dẹp tài nguyên khi ngắt kết nối ví)
   */
  removeEventListeners() {
    if (this.contract) {
      try {
        this.contract.removeAllListeners();
        this.activeCallbacks = null;
        console.log("[Web3Service - Phase 6] Đã hủy đăng ký toàn bộ sự kiện On-Chain.");
      } catch (err) {
        console.warn("[Web3Service - Phase 6] Lỗi khi gỡ event listeners:", err);
      }
    }
  }

  /**
   * Phát sự kiện CustomEvent trên window cho các module UI khác bắt được mà không cần phụ thuộc chặt chẽ
   * @private
   */
  _dispatchWeb3Event(eventName, detail) {
    try {
      window.dispatchEvent(new CustomEvent(`web3:${eventName}`, { detail }));
    } catch (_) {}
  }

  /**
   * Truy vấn lịch sử sự kiện On-Chain từ một block nhất định
   * @param {string} eventName - Tên sự kiện ("VoteCasted", "CandidateAdded", ...)
   * @param {number|string} fromBlock - Khối bắt đầu (mặc định 0)
   */
  async getPastEvents(eventName, fromBlock = 0) {
    if (!this.contract) return [];
    try {
      const filter = this.contract.filters[eventName]();
      const events = await this.contract.queryFilter(filter, fromBlock, "latest");
      return events;
    } catch (err) {
      console.warn(`[Web3Service - Phase 6] Không thể truy vấn lịch sử sự kiện ${eventName}:`, err.message);
      return [];
    }
  }

  /**
   * PHASE 7: Chuẩn hóa hệ thống bắt lỗi ngoại lệ ACTION_REJECTED và Revert reasons
   * Phân loại lỗi MetaMask (từ chối ký), lỗi thiếu gas, lỗi RPC và các require revert từ Smart Contract
   * @param {Error|Object|string} error - Đối tượng lỗi từ Ethers.js v6 hoặc MetaMask RPC
   * @returns {string} Thông báo lỗi tiếng Việt thân thiện, rõ nghĩa cho người dùng
   */
  parseError(error) {
    if (!error) return "Đã xảy ra lỗi không xác định trên hệ thống.";
    if (typeof error === "string") return error;

    console.error("[Web3Service - Phase 7] Chi tiết ngoại lệ:", error);

    // 1. Nhóm lỗi người dùng từ chối thao tác (EIP-1193 code 4001 hoặc ACTION_REJECTED)
    const errCode = error.code;
    const rawMsg = (error.message || "").toLowerCase();
    const shortMsg = error.shortMessage || "";

    if (
      errCode === "ACTION_REJECTED" ||
      errCode === 4001 ||
      rawMsg.includes("user rejected") ||
      rawMsg.includes("user denied") ||
      rawMsg.includes("action_rejected") ||
      rawMsg.includes("cancelled")
    ) {
      return "Giao dịch đã bị hủy: Bạn đã từ chối ký xác nhận giao dịch trên ví MetaMask.";
    }

    // 2. Nhóm lỗi không đủ số dư trả phí Gas (Insufficient Funds)
    if (
      errCode === "INSUFFICIENT_FUNDS" ||
      rawMsg.includes("insufficient funds") ||
      rawMsg.includes("exceeds balance") ||
      rawMsg.includes("gas * price + value")
    ) {
      return "Số dư SepoliaETH trong ví của bạn không đủ để chi trả phí gas giao dịch!";
    }

    // 3. Trích xuất lý do Revert từ Smart Contract (hỗ trợ nhiều cấp độ bọc lỗi của Ethers v6)
    let reason =
      error.reason ||
      error.revert?.args?.[0] ||
      error.info?.error?.message ||
      error.data?.message ||
      error.error?.data?.message ||
      "";

    // Tìm trong chuỗi reason hoặc chuỗi thông điệp tổng quát
    const fullText = `${reason} ${shortMsg} ${error.message || ""}`;

    // 4. Ánh xạ chi tiết 10 điều kiện require revert từ Voting.sol sang tiếng Việt chuẩn mực:
    if (fullText.includes("Chi nguoi quan tri") || fullText.includes("onlyAdmin")) {
      return "Quyền truy cập bị từ chối: Chỉ người quản trị (Admin) mới có quyền thực hiện thao tác này!";
    }
    if (fullText.includes("Ten ung vien khong duoc de trong")) {
      return "Dữ liệu không hợp lệ: Họ và tên ứng cử viên không được để trống!";
    }
    if (fullText.includes("Dia chi vi khong hop le")) {
      return "Địa chỉ không hợp lệ: Địa chỉ ví cử tri không được là địa chỉ rỗng (0x0)!";
    }
    if (fullText.includes("Cu tri nay da duoc dang ky truoc do")) {
      return "Cử tri này đã được cấp quyền trước đó rồi (không thể đăng ký trùng lặp)!";
    }
    if (fullText.includes("Can it nhat 2 ung vien")) {
      return "Chưa đủ điều kiện: Cần ít nhất 2 ứng cử viên để bắt đầu cuộc bình chọn!";
    }
    if (fullText.includes("Ban khong co ten trong danh sach")) {
      return "Bạn chưa được cấp quyền: Địa chỉ ví hiện tại chưa có trong danh sách cử tri được phép bỏ phiếu!";
    }
    if (fullText.includes("Ban da bo phieu roi")) {
      return "Chống gian lận: Bạn đã bỏ phiếu rồi, hệ thống Blockchain chặn bỏ phiếu lần thứ hai!";
    }
    if (fullText.includes("Ma so ung vien khong hop le")) {
      return "Mã số ứng cử viên không hợp lệ hoặc không tồn tại trong danh sách!";
    }
    if (fullText.includes("Chuc nang khong the thuc hien") || fullText.includes("checkStatus")) {
      return "Giai đoạn hiện tại của cuộc bầu cử không cho phép thực hiện hành động này!";
    }
    if (fullText.includes("Cuoc bau cu chua ket thuc")) {
      return "Cuộc bầu cử chưa kết thúc nên chưa thể xác định người đắc cử!";
    }

    // 5. Nhóm lỗi kết nối mạng, RPC Blockchain & Rate limit
    if (
      errCode === -32002 ||
      rawMsg.includes("-32002") ||
      rawMsg.includes("returned too many errors") ||
      rawMsg.includes("could not coalesce error") ||
      rawMsg.includes("endpoint returned")
    ) {
      return "Node RPC Sepolia của MetaMask đang bị nghẽn mạng (quá tải), hoặc địa chỉ hợp đồng chưa được Deploy lên Sepolia. Vui lòng deploy hợp đồng lên Sepolia hoặc thử lại sau giây lát!";
    }

    if (rawMsg.includes("contract_not_deployed_on_network")) {
      return "Hợp đồng chưa được Deploy lên mạng Sepolia! Vui lòng hoàn tất bước Deploy trên Remix và cập nhật địa chỉ hợp đồng trước khi thực hiện giao dịch.";
    }

    if (
      errCode === "NETWORK_ERROR" ||
      rawMsg.includes("could not detect network") ||
      rawMsg.includes("failed to fetch") ||
      rawMsg.includes("connection reset")
    ) {
      return "Lỗi kết nối mạng: Không thể kết nối với node Blockchain. Vui lòng kiểm tra lại mạng Internet hoặc RPC!";
    }

    if (errCode === "UNPREDICTABLE_GAS_LIMIT" || rawMsg.includes("cannot estimate gas")) {
      return "Lỗi ước tính Gas: Giao dịch có thể sẽ bị Revert do vi phạm quy tắc Smart Contract.";
    }

    if (errCode === "NONCE_EXPIRED" || rawMsg.includes("replacement transaction underpriced")) {
      return "Lỗi Nonce: Đang có giao dịch khác chờ xử lý trên ví. Vui lòng tăng Gas hoặc thử lại sau.";
    }

    // 6. Trả về reason nguyên bản nếu có, hoặc rút ngắn thông điệp kỹ thuật
    if (reason && typeof reason === "string" && !reason.includes("execution reverted")) {
      return reason;
    }

    return shortMsg || error.message || "Giao dịch thất bại trên Blockchain.";
  }
}

// Khởi tạo đối tượng toàn cục duy nhất
window.Web3Service = new Web3Service();
