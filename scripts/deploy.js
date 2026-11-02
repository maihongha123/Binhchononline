const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log(" BẮT ĐẦU TRIỂN KHAI SMART CONTRACT VOTING... ");
  console.log("==================================================");

  // Lấy tài khoản người triển khai (Deployer / Admin)
  const [deployer] = await hre.ethers.getSigners();
  console.log("Địa chỉ ví của Quản trị viên (Admin):", deployer.address);

  // Khởi tạo Contract Factory
  const electionTitle = "Bầu cử Ban Cán Sự Khóa 2026";
  const Voting = await hre.ethers.getContractFactory("Voting");
  
  // Triển khai hợp đồng với tham số truyền vào hàm constructor
  const voting = await Voting.deploy(electionTitle);
  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();
  console.log("--------------------------------------------------");
  console.log(" Smart Contract đã được triển khai thành công!");
  console.log(" Địa chỉ hợp đồng (Contract Address):", contractAddress);
  console.log(" Tên cuộc bầu cử:", electionTitle);
  console.log("--------------------------------------------------");

  // Xuất cấu hình tự động sang thư mục frontend để Thành viên 3 kết nối giao diện
  const configDir = path.join(__dirname, "../frontend");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Lấy ABI từ file artifact biên dịch của Hardhat
  const artifactPath = path.join(__dirname, "../artifacts/contracts/Voting.sol/Voting.json");
  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abi = artifact.abi;
  }

  // Lấy chainId hiện tại
  const network = await hre.ethers.provider.getNetwork();

  const contractData = {
    address: contractAddress,
    network: hre.network.name,
    chainId: network.chainId.toString(),
    adminAddress: deployer.address,
    abi: abi
  };

  fs.writeFileSync(
    path.join(configDir, "contract-config.json"),
    JSON.stringify(contractData, null, 2)
  );
  console.log(" Đã tự động xuất Địa chỉ hợp đồng & ABI sang: frontend/contract-config.json");
}

main().catch((error) => {
  console.error("Lỗi trong quá trình triển khai:", error);
  process.exitCode = 1;
});
