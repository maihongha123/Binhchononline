// ==============================================================================
// DỰ ÁN BÌNH CHỌN BLOCKCHAIN (DAPP)
// PHÂN HỆ: KỊCH BẢN TRIỂN KHAI & TỰ ĐỘNG HÓA CẤU HÌNH (DEPLOYMENT & CONFIG GENERATION)
// TÁC GIẢ CHỊU TRÁCH NHIỆM: THÀNH VIÊN 2 (Web3 Middleware & Deployment Engineer)
// PHASE 1: Xây dựng script Hardhat deployment và trích xuất config tự động
// ==============================================================================

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log(" [PHASE 1] BẮT ĐẦU TRIỂN KHAI SMART CONTRACT VOTING... ");
  console.log("==================================================");

  // 1. Lấy tài khoản người triển khai hợp đồng (Deployer / Admin)
  const [deployer] = await hre.ethers.getSigners();
  console.log("-> Địa chỉ ví Quản trị viên (Deployer / Admin):", deployer.address);

  // 2. Khởi tạo Contract Factory từ artifact đã biên dịch
  const electionTitle = "Bầu cử Ban Cán Sự Khóa 2026";
  const Voting = await hre.ethers.getContractFactory("Voting");
  
  // 3. Triển khai hợp đồng với tham số khởi tạo truyền vào constructor
  console.log("-> Đang phát sóng giao dịch triển khai lên mạng...");
  const voting = await Voting.deploy(electionTitle);
  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();
  console.log("--------------------------------------------------");
  console.log(" Smart Contract đã được triển khai thành công!");
  console.log(" Địa chỉ hợp đồng (Contract Address):", contractAddress);
  console.log(" Tên cuộc bầu cử:", electionTitle);
  console.log("--------------------------------------------------");

  // 4. Xuất cấu hình tự động sang thư mục frontend (contract-config.json)
  const configDir = path.join(__dirname, "../frontend");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // 5. Trích xuất ABI từ file artifact biên dịch của Hardhat
  const artifactPath = path.join(__dirname, "../artifacts/contracts/Voting.sol/Voting.json");
  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abi = artifact.abi;
  }

  // 6. Lấy thông tin mạng và ChainID hiện tại
  const network = await hre.ethers.provider.getNetwork();

  const contractData = {
    address: contractAddress,
    network: hre.network.name,
    chainId: network.chainId.toString(),
    adminAddress: deployer.address,
    abi: abi
  };

  const outputPath = path.join(configDir, "contract-config.json");
  fs.writeFileSync(outputPath, JSON.stringify(contractData, null, 2));

  console.log(" [TỰ ĐỘNG HÓA] Đã xuất cấu hình kết nối sang:", outputPath);
  console.log("==================================================");
}

main().catch((error) => {
  console.error("Lỗi trong quá trình triển khai hợp đồng:", error);
  process.exitCode = 1;
});
