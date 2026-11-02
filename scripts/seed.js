const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log(" KHỞI TẠO DỮ LIỆU MẪU TỰ ĐỘNG (SEED DATA SCRIPT) ");
  console.log("==================================================");

  const signers = await hre.ethers.getSigners();
  const admin = signers[0];
  const voters = signers.slice(1, 5); // 4 cử tri thử nghiệm

  console.log("1. Tài khoản Quản trị viên (Admin):", admin.address);
  console.log("2. Danh sách 4 cử tri mẫu:");
  voters.forEach((v, idx) => console.log(`   - Cử tri #${idx + 1}: ${v.address}`));

  // Triển khai hợp đồng mới
  const electionTitle = "Bầu Cử Đại Diện Sinh Viên Xuất Sắc 2026";
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(electionTitle);
  await voting.waitForDeployment();
  const contractAddress = await voting.getAddress();

  console.log("\n-> Hợp đồng đã triển khai tại:", contractAddress);

  // Thêm 3 ứng cử viên
  console.log("\n-> Đang thêm 3 ứng cử viên mẫu...");
  await (await voting.connect(admin).addCandidate("Nguyễn Văn A (Ủy Viên Ban Chấp Hành)")).wait();
  await (await voting.connect(admin).addCandidate("Trần Thị B (Trưởng Ban Truyền Thông)")).wait();
  await (await voting.connect(admin).addCandidate("Lê Văn C (Đội Trưởng Nghiên Cứu)")).wait();
  console.log("   ✓ Đã thêm 3 ứng cử viên thành công!");

  // Cấp quyền cho 4 cử tri
  console.log("\n-> Đang cấp quyền bỏ phiếu (Whitelist) cho 4 ví cử tri...");
  for (const voter of voters) {
    await (await voting.connect(admin).registerVoter(voter.address)).wait();
  }
  console.log("   ✓ Đã cấp quyền bỏ phiếu cho 4 cử tri thành công!");

  // Mở hòm phiếu
  console.log("\n-> Admin kích hoạt mở hòm phiếu (startVoting)...");
  await (await voting.connect(admin).startVoting()).wait();
  console.log("   ✓ Trạng thái hiện tại: 1 - Đang Bỏ Phiếu (Voting)");

  // Mô phỏng 3 cử tri bỏ phiếu
  console.log("\n-> Mô phỏng các cử tri thực hiện bỏ phiếu:");
  await (await voting.connect(voters[0]).vote(1)).wait(); // Cử tri 1 bầu Ứng viên 1
  console.log("   • Cử tri #1 đã bầu cho Ứng viên #1");

  await (await voting.connect(voters[1]).vote(1)).wait(); // Cử tri 2 bầu Ứng viên 1
  console.log("   • Cử tri #2 đã bầu cho Ứng viên #1");

  await (await voting.connect(voters[2]).vote(2)).wait(); // Cử tri 3 bầu Ứng viên 2
  console.log("   • Cử tri #3 đã bầu cho Ứng viên #2");

  // Xuất file cấu hình sang frontend
  const configDir = path.join(__dirname, "../frontend");
  const artifactPath = path.join(__dirname, "../artifacts/contracts/Voting.sol/Voting.json");
  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abi = artifact.abi;
  }

  const network = await hre.ethers.provider.getNetwork();
  const contractData = {
    address: contractAddress,
    network: hre.network.name,
    chainId: network.chainId.toString(),
    adminAddress: admin.address,
    abi: abi
  };

  fs.writeFileSync(
    path.join(configDir, "contract-config.json"),
    JSON.stringify(contractData, null, 2)
  );

  console.log("\n==================================================");
  console.log(" DỮ LIỆU ĐÃ SẴN SÀNG ĐỂ DEMO!");
  console.log(" - Hợp đồng: ", contractAddress);
  console.log(" - Trạng thái: Voting (Đang mở bình chọn)");
  console.log(" - Cử tri #4 (", voters[3].address, ") chưa vote -> Dùng tài khoản này demo vote trực tiếp trên trình duyệt!");
  console.log(" - Đã ghi đè file: frontend/contract-config.json");
  console.log("==================================================");
}

main().catch((error) => {
  console.error("Lỗi khởi tạo dữ liệu:", error);
  process.exitCode = 1;
});
