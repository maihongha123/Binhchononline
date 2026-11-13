// ==============================================================================
// DỰ ÁN BÌNH CHỌN BLOCKCHAIN (DAPP)
// PHÂN HỆ: WEB3 MIDDLEWARE & GIAO TIẾP BLOCKCHAIN
// TÁC GIẢ CHỊU TRÁCH NHIỆM: THÀNH VIÊN 2 (Web3 Middleware & Deployment Engineer)
// PHASE 3: Tách module web3-service.js kết nối Ethers.js v6 và MetaMask
// ==============================================================================

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.currentAccount = null;
    this.contractAddress = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";
    this.contractAdmin = null;
    this.chainId = 31337n;
    this.targetNetwork = "localhost";
    this.abi = null;
    this.isConnecting = false;

    // Cấu hình các mạng Blockchain hỗ trợ (Localhost & Sepolia Testnets)
    this.SUPPORTED_NETWORKS = {
      "31337": {
        chainIdHex: "0x7a69",
        chainName: "Hardhat Localhost",
        rpcUrls: ["http://127.0.0.1:8545"],
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: null
      },
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
      const res = await fetch("contract-config.json");
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
   * Kết nối ví MetaMask và chuyển đúng mạng mục tiêu (Sepolia hoặc Localhost)
   */
  async connect() {
    this.checkPrerequisites();
    if (this.isConnecting) return null;
    this.isConnecting = true;

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      this.provider = new ethers.BrowserProvider(window.ethereum);

      // Đồng bộ mạng mục tiêu
      await this.ensureCorrectNetwork();

      this.signer = await this.provider.getSigner();
      this.currentAccount = await this.signer.getAddress();

      // Khởi tạo Smart Contract Instance
      const activeAbi = this.abi || this.FALLBACK_ABI;
      this.contract = new ethers.Contract(this.contractAddress, activeAbi, this.signer);

      // Tra cứu địa chỉ Admin từ hợp đồng
      try {
        this.contractAdmin = await this.contract.admin();
      } catch (err) {
        console.warn("[Web3Service] Không đọc được admin từ contract:", err);
      }

      this.isConnecting = false;
      return {
        account: this.currentAccount,
        admin: this.contractAdmin,
        isAdmin: this.contractAdmin ? this.contractAdmin.toLowerCase() === this.currentAccount.toLowerCase() : false,
        chainId: this.chainId.toString(),
        networkName: this.getNetworkName()
      };
    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Tự động kết nối nếu người dùng đã ủy quyền trước đó (khi F5 trang)
   */
  async autoConnect() {
    if (typeof window.ethereum === "undefined" || window.location.protocol === "file:") {
      return null;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts && accounts.length > 0) {
        console.log("[Web3Service] Tự động kết nối lại ví:", accounts[0]);
        return await this.connect();
      }
    } catch (err) {
      console.warn("[Web3Service] Lỗi autoConnect:", err);
    }
    return null;
  }

  /**
   * Đảm bảo ví đang ở đúng mạng chỉ định (Sepolia / Localhost)
   */
  async ensureCorrectNetwork() {
    const currentNetwork = await this.provider.getNetwork();
    const targetChainIdStr = this.chainId.toString();

    if (currentNetwork.chainId !== this.chainId) {
      const netConfig = this.SUPPORTED_NETWORKS[targetChainIdStr];
      if (!netConfig) {
        console.warn(`[Web3Service] Chưa định nghĩa cấu hình mạng ChainID ${targetChainIdStr}`);
        return;
      }

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: netConfig.chainIdHex }]
        });
      } catch (switchError) {
        // Mã 4902: Mạng chưa được thêm vào MetaMask
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
        } else {
          throw switchError;
        }
      }
      this.provider = new ethers.BrowserProvider(window.ethereum);
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
   * Truy vấn toàn bộ dữ liệu cuộc bầu cử từ Blockchain
   */
  async fetchElectionData() {
    if (!this.contract) throw new Error("Chưa kết nối hợp đồng thông minh!");

    const [title, statusRaw, totalVotesRaw, rawCandidates] = await Promise.all([
      this.contract.electionName(),
      this.contract.currentStatus(),
      this.contract.totalVotes(),
      this.contract.getCandidates()
    ]);

    const status = Number(statusRaw);
    const totalVotes = Number(totalVotesRaw);

    let highestVote = 0;
    const candidates = rawCandidates.map(c => {
      const vCount = Number(c.voteCount);
      if (vCount > highestVote) highestVote = vCount;
      return {
        id: Number(c.id),
        name: c.name,
        voteCount: vCount
      };
    });

    // Thông tin cử tri hiện tại
    let voterInfo = { isRegistered: false, hasVoted: false, votedCandidateId: 0 };
    if (this.currentAccount) {
      try {
        const v = await this.contract.voters(this.currentAccount);
        voterInfo = {
          isRegistered: Boolean(v.isRegistered),
          hasVoted: Boolean(v.hasVoted),
          votedCandidateId: Number(v.votedCandidateId)
        };
      } catch (e) {
        console.warn("[Web3Service] Không đọc được thông tin cử tri:", e);
      }
    }

    // Thông tin người chiến thắng (nếu đã Ended)
    let winner = null;
    if (status === 2) {
      try {
        const res = await this.contract.getWinner();
        winner = {
          name: res[0],
          voteCount: Number(res[1])
        };
      } catch (e) {
        console.warn("[Web3Service] Lỗi đọc getWinner:", e);
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

  /**
   * Giao dịch: Bỏ phiếu cho ứng viên
   */
  async vote(candidateId) {
    if (!this.contract) throw new Error("Chưa kết nối ví!");
    const tx = await this.contract.vote(candidateId);
    const receipt = await tx.wait();
    return { txHash: tx.hash, receipt };
  }

  /**
   * Giao dịch Admin: Thêm ứng viên mới
   */
  async addCandidate(name) {
    if (!this.contract) throw new Error("Chưa kết nối ví!");
    const tx = await this.contract.addCandidate(name);
    const receipt = await tx.wait();
    return { txHash: tx.hash, receipt };
  }

  /**
   * Giao dịch Admin: Cấp quyền cử tri (Whitelist)
   */
  async registerVoter(voterAddress) {
    if (!this.contract) throw new Error("Chưa kết nối ví!");
    if (!ethers.isAddress(voterAddress)) {
      throw new Error("Địa chỉ ví Ethereum không hợp lệ!");
    }
    const tx = await this.contract.registerVoter(voterAddress);
    const receipt = await tx.wait();
    return { txHash: tx.hash, receipt };
  }

  /**
   * Giao dịch Admin: Mở hòm phiếu (chuyển sang Voting)
   */
  async startVoting() {
    if (!this.contract) throw new Error("Chưa kết nối ví!");
    const tx = await this.contract.startVoting();
    const receipt = await tx.wait();
    return { txHash: tx.hash, receipt };
  }

  /**
   * Giao dịch Admin: Khóa hòm phiếu (chuyển sang Ended)
   */
  async endVoting() {
    if (!this.contract) throw new Error("Chưa kết nối ví!");
    const tx = await this.contract.endVoting();
    const receipt = await tx.wait();
    return { txHash: tx.hash, receipt };
  }

  /**
   * Đăng ký 4 trình lắng nghe sự kiện On-Chain thời gian thực từ Smart Contract
   */
  setupEventListeners(callbacks = {}) {
    if (!this.contract) return;
    this.contract.removeAllListeners();

    this.contract.on("VoteCasted", (voter, candidateId) => {
      console.log(`[On-Chain Event] VoteCasted: Cử tri ${voter} đã bầu #${candidateId}`);
      if (callbacks.onVoteCasted) callbacks.onVoteCasted(voter, Number(candidateId));
    });

    this.contract.on("CandidateAdded", (candidateId, name) => {
      console.log(`[On-Chain Event] CandidateAdded: "${name}" (#${candidateId})`);
      if (callbacks.onCandidateAdded) callbacks.onCandidateAdded(Number(candidateId), name);
    });

    this.contract.on("VoterRegistered", (voterAddress) => {
      console.log(`[On-Chain Event] VoterRegistered: ${voterAddress}`);
      if (callbacks.onVoterRegistered) callbacks.onVoterRegistered(voterAddress);
    });

    this.contract.on("StatusChanged", (prevStatus, newStatus) => {
      console.log(`[On-Chain Event] StatusChanged: ${prevStatus} -> ${newStatus}`);
      if (callbacks.onStatusChanged) callbacks.onStatusChanged(Number(prevStatus), Number(newStatus));
    });
  }

  /**
   * Chuẩn hóa thông báo lỗi thân thiện cho người dùng
   */
  parseError(error) {
    if (!error) return "Đã xảy ra lỗi không xác định.";
    if (error.code === "ACTION_REJECTED" || error.message?.includes("user rejected") || error.message?.includes("ACTION_REJECTED")) {
      return "Người dùng đã hủy hoặc từ chối ký giao dịch trên MetaMask.";
    }
    if (error.reason) return error.reason;
    if (error.data?.message) return error.data.message;
    if (error.message?.includes("Chi nguoi quan tri")) return "Chỉ người quản trị (Admin) mới có quyền thực hiện thao tác này!";
    if (error.message?.includes("Chuc nang khong the thuc hien")) return "Chức năng không được phép ở giai đoạn bầu cử này!";
    if (error.message?.includes("Ban khong co ten trong danh sach")) return "Địa chỉ ví của bạn chưa được cấp quyền bỏ phiếu!";
    if (error.message?.includes("Ban da bo phieu roi")) return "Bạn đã bỏ phiếu rồi, không thể bỏ phiếu lần thứ hai!";
    return error.shortMessage || error.message || "Giao dịch thất bại trên Blockchain.";
  }
}

// Khởi tạo đối tượng toàn cục duy nhất
window.Web3Service = new Web3Service();

