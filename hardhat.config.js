// ==============================================================================
// DỰ ÁN BÌNH CHỌN BLOCKCHAIN (DAPP)
// PHÂN HỆ: CẤU HÌNH MẠNG TESTNET & HARDHAT CONFIG
// TÁC GIẢ CHỊU TRÁCH NHIỆM: THÀNH VIÊN 2 (Web3 Middleware & Deployment Engineer)
// PHASE 4: Cấu hình mạng Ethereum Sepolia (11155111) và Unichain Sepolia (1301)
// ==============================================================================

require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // 1. Mạng cục bộ Localhost (ChainID 31337)
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    // 2. Mạng công khai Ethereum Sepolia Testnet (ChainID 11155111)
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    },
    // 3. Mạng công khai Unichain Sepolia Testnet (ChainID 1301 - Theo Chainlist)
    unichainSepolia: {
      url: process.env.UNICHAIN_RPC_URL || "https://sepolia.unichain.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1301
    }
  }
};
