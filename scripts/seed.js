// ==============================================================================
// DỰ ÁN BÌNH CHỌN BLOCKCHAIN (DAPP)
// PHÂN HỆ: KỊCH BẢN NẠP DỮ LIỆU MẪU & KHỞI TẠO BẦU CỬ DEMO (SEED DATA SCRIPT)
// TÁC GIẢ CHỊU TRÁCH NHIỆM: THÀNH VIÊN 2 (Web3 Middleware & Deployment Engineer)
// PHASE 11: Tích hợp luồng chuyển đổi poll realtime trong main bridge và cập nhật seed script
// ==============================================================================

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log(" [PHASE 11] KHỞI TẠO DỮ LIỆU MẪU ĐA CUỘC BÌNH CHỌN (MULTI-POLL SEED) ");
  console.log("==================================================");

  // 1. Lấy danh sách tài khoản từ node mạng
  const signers = await hre.ethers.getSigners();
  const admin = signers[0];
  const voters = signers.slice(1, 5); // 4 cử tri thử nghiệm

  console.log("1. Tài khoản Quản trị viên (Admin):", admin.address);
  console.log("2. Danh sách 4 cử tri mẫu:");
  voters.forEach((v, idx) => console.log(`   - Cử tri #${idx + 1}: ${v.address}`));

  // 2. Triển khai hợp đồng mới với tiêu đề cuộc bầu cử số 1
  const electionTitle1 = "Bầu Cử Đại Diện Sinh Viên Xuất Sắc 2026";
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(electionTitle1);
  await voting.waitForDeployment();
  const contractAddress = await voting.getAddress();

  console.log("\n-> Hợp đồng đã triển khai tại:", contractAddress);

  // -------------------------------------------------------------
  // CUỘC BÌNH CHỌN SỐ 1
  // -------------------------------------------------------------
  console.log(`\n=== [CUỘC BÌNH CHỌN #1]: "${electionTitle1}" ===`);
  console.log("-> Đang thêm 3 ứng cử viên mẫu...");
  await (await voting.connect(admin).addCandidate("Nguyễn Văn A (Ủy Viên Ban Chấp Hành)")).wait();
  await (await voting.connect(admin).addCandidate("Trần Thị B (Trưởng Ban Truyền Thông)")).wait();
  await (await voting.connect(admin).addCandidate("Lê Văn C (Đội Trưởng Nghiên Cứu)")).wait();
  console.log("   ✓ Đã thêm 3 ứng cử viên thành công!");

  console.log("-> Đang cấp quyền bỏ phiếu (Whitelist) cho 4 ví cử tri...");
  for (const voter of voters) {
    await (await voting.connect(admin).registerVoter(voter.address)).wait();
  }
  console.log("   ✓ Đã cấp quyền bỏ phiếu cho 4 cử tri thành công!");

  console.log("-> Admin kích hoạt mở hòm phiếu Poll #1 (startVoting)...");
  await (await voting.connect(admin).startVoting()).wait();
  console.log("   ✓ Poll #1: 1 - Đang Bỏ Phiếu (Voting)");

  console.log("-> Mô phỏng các cử tri bỏ phiếu tại Poll #1:");
  await (await voting.connect(voters[0]).vote(1)).wait(); // Cử tri 1 bầu Ứng viên 1
  await (await voting.connect(voters[1]).vote(1)).wait(); // Cử tri 2 bầu Ứng viên 1
  await (await voting.connect(voters[2]).vote(2)).wait(); // Cử tri 3 bầu Ứng viên 2
  console.log("   ✓ 3 cử tri đã bỏ phiếu xong tại Poll #1.");

  // -------------------------------------------------------------
  // CUỘC BÌNH CHỌN SỐ 2 (PHASE 11: MULTI-POLL DEMO)
  // -------------------------------------------------------------
  const electionTitle2 = "Bình Chọn Đề Tài Khởi Nghiệp Công Nghệ 2026";
  console.log(`\n=== [CUỘC BÌNH CHỌN #2]: "${electionTitle2}" ===`);
  await (await voting.connect(admin).createPoll(electionTitle2)).wait();
  console.log("   ✓ Đã khởi tạo Poll #2 thành công trên cùng Smart Contract!");

  // Chuyển sang Poll #2 để nạp dữ liệu
  await (await voting.connect(admin).switchPoll(2)).wait();
  console.log("   ✓ Đã chuyển activePollId sang #2");

  await (await voting.connect(admin).addCandidate("Dự án Nông Nghiệp Thông Minh IoT (Nhóm 1)")).wait();
  await (await voting.connect(admin).addCandidate("Ứng Dụng Quản Lý Chi Tiêu Sinh Viên AI (Nhóm 2)")).wait();
  console.log("   ✓ Đã thêm 2 ứng cử viên đề tài cho Poll #2!");

  // Cấp quyền cử tri tại Poll #2
  await (await voting.connect(admin).registerVoter(voters[0].address)).wait();
  await (await voting.connect(admin).registerVoter(voters[1].address)).wait();
  await (await voting.connect(admin).registerVoter(voters[3].address)).wait();
  console.log("   ✓ Đã cấp quyền cử tri độc lập tại Poll #2!");

  // Mở hòm phiếu Poll #2
  await (await voting.connect(admin).startVoting()).wait();
  console.log("   ✓ Poll #2: 1 - Đang Bỏ Phiếu (Voting)");

  // Cử tri 1 bỏ phiếu tại Poll #2
  await (await voting.connect(voters[0]).vote(1)).wait();
  console.log("   ✓ Cử tri #1 đã bỏ phiếu tại Poll #2!");

  // Chuyển lại về Poll #1 làm mặc định
  await (await voting.connect(admin).switchPoll(1)).wait();
  console.log("   ✓ Đã chuyển lại Poll #1 làm mặc định.");

  // 7. Xuất cấu hình tự động sang frontend để đồng bộ ngay
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
  console.log(" DỮ LIỆU ĐÃ SẴN SÀNG ĐỂ DEMO ĐA CUỘC BÌNH CHỌN!");
  console.log(" - Hợp đồng: ", contractAddress);
  console.log(" - Tổng số Polls: 2 cuộc bình chọn song song trên 1 contract");
  console.log("   + Poll #1: Bầu Cử Đại Diện Sinh Viên Xuất Sắc 2026");
  console.log("   + Poll #2: Bình Chọn Đề Tài Khởi Nghiệp Công Nghệ 2026");
  console.log(" - Cử tri #4 (", voters[3].address, ") chưa vote ở Poll #1!");
  console.log(" - Đã ghi đè file: frontend/contract-config.json");
  console.log("==================================================");
}

main().catch((error) => {
  console.error("Lỗi khởi tạo dữ liệu:", error);
  process.exitCode = 1;
});
