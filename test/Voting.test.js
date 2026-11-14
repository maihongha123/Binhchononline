const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * BỘ KIỂM THỬ TỰ ĐỘNG SMART CONTRACT VOTING - PHASE 8
 * Phụ trách: Minh Em - Smart Contract & Core Logic Engineer
 * Mục tiêu: 15 Unit Test cases kiểm thử các luồng chức năng cơ bản
 */
describe("KIỂM THỬ CƠ BẢN HỆ THỐNG BÌNH CHỌN (15 TEST CASES - PHASE 8)", function () {
  let voting;
  let admin, voter1, voter2, stranger;

  beforeEach(async function () {
    // Lấy danh sách ví giả lập từ môi trường Hardhat
    [admin, voter1, voter2, stranger] = await ethers.getSigners();

    // Triển khai hợp đồng Voting mới trước mỗi bài kiểm thử
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy("Bầu cử Đại Biểu Sinh Viên 2026");
    await voting.waitForDeployment();
  });

  // =================================================================
  // 1. KHỞI TẠO HỢP ĐỒNG (3 TEST CASES)
  // =================================================================
  describe("1. Khởi tạo hợp đồng", function () {
    it("1.1 Người triển khai hợp đồng phải là Quản trị viên (Admin)", async function () {
      expect(await voting.admin()).to.equal(admin.address);
    });

    it("1.2 Tên cuộc bầu cử phải được thiết lập chính xác", async function () {
      expect(await voting.electionName()).to.equal("Bầu cử Đại Biểu Sinh Viên 2026");
    });

    it("1.3 Trạng thái ban đầu của cuộc bầu cử phải là Registering (0)", async function () {
      expect(await voting.currentStatus()).to.equal(0);
    });
  });

  // =================================================================
  // 2. QUẢN LÝ ỨNG CỬ VIÊN (3 TEST CASES)
  // =================================================================
  describe("2. Quản lý Ứng cử viên", function () {
    it("2.1 Admin có thể thêm ứng cử viên đầu tiên thành công", async function () {
      await voting.connect(admin).addCandidate("Nguyễn Văn A");
      const candidates = await voting.getCandidates();
      expect(candidates.length).to.equal(1);
      expect(candidates[0].name).to.equal("Nguyễn Văn A");
    });

    it("2.2 Admin có thể thêm nhiều ứng cử viên liên tiếp", async function () {
      await voting.connect(admin).addCandidate("Nguyễn Văn A");
      await voting.connect(admin).addCandidate("Trần Thị B");
      expect(await voting.getCandidatesCount()).to.equal(2);
    });

    it("2.3 Ứng viên mới thêm được gán đúng ID tự tăng và voteCount bằng 0", async function () {
      await voting.connect(admin).addCandidate("Nguyễn Văn A");
      await voting.connect(admin).addCandidate("Trần Thị B");
      const candidates = await voting.getCandidates();
      expect(candidates[0].id).to.equal(1);
      expect(candidates[0].voteCount).to.equal(0);
      expect(candidates[1].id).to.equal(2);
      expect(candidates[1].voteCount).to.equal(0);
    });
  });

  // =================================================================
  // 3. ĐĂNG KÝ & CẤP QUYỀN CỬ TRI (3 TEST CASES)
  // =================================================================
  describe("3. Đăng ký & Cấp quyền Cử tri", function () {
    it("3.1 Admin có thể cấp quyền bỏ phiếu cho cử tri", async function () {
      await voting.connect(admin).registerVoter(voter1.address);
      const v1 = await voting.voters(voter1.address);
      expect(v1.isRegistered).to.be.true;
    });

    it("3.2 Cử tri mới đăng ký có trạng thái hasVoted bằng false", async function () {
      await voting.connect(admin).registerVoter(voter1.address);
      const v1 = await voting.voters(voter1.address);
      expect(v1.hasVoted).to.be.false;
      expect(v1.votedCandidateId).to.equal(0);
    });

    it("3.3 Admin có thể cấp quyền thành công cho nhiều cử tri khác nhau", async function () {
      await voting.connect(admin).registerVoter(voter1.address);
      await voting.connect(admin).registerVoter(voter2.address);
      expect((await voting.voters(voter1.address)).isRegistered).to.be.true;
      expect((await voting.voters(voter2.address)).isRegistered).to.be.true;
    });
  });

  // =================================================================
  // 4. QUY TRÌNH MỞ & ĐÓNG HÒM PHIẾU (3 TEST CASES)
  // =================================================================
  describe("4. Quy trình Mở & Đóng hòm phiếu", function () {
    beforeEach(async function () {
      await voting.connect(admin).addCandidate("Nguyễn Văn A");
      await voting.connect(admin).addCandidate("Trần Thị B");
    });

    it("4.1 Admin có thể mở hòm phiếu khi đã có đủ từ 2 ứng cử viên", async function () {
      await voting.connect(admin).startVoting();
      expect(await voting.currentStatus()).to.equal(1); // 1 = Voting
    });

    it("4.2 Trạng thái được ghi nhận chính xác sau khi bắt đầu bỏ phiếu", async function () {
      await voting.connect(admin).startVoting();
      expect(await voting.currentStatus()).to.equal(1);
    });

    it("4.3 Admin có thể đóng hòm phiếu và chuyển sang trạng thái Ended (2)", async function () {
      await voting.connect(admin).startVoting();
      await voting.connect(admin).endVoting();
      expect(await voting.currentStatus()).to.equal(2); // 2 = Ended
    });
  });

  // =================================================================
  // 5. BỎ PHIẾU HỢP LỆ & XEM KẾT QUẢ CƠ BẢN (3 TEST CASES)
  // =================================================================
  describe("5. Bỏ phiếu Hợp lệ & Xem Kết quả Cơ bản", function () {
    beforeEach(async function () {
      await voting.connect(admin).addCandidate("Nguyễn Văn A");
      await voting.connect(admin).addCandidate("Trần Thị B");
      await voting.connect(admin).registerVoter(voter1.address);
      await voting.connect(admin).registerVoter(voter2.address);
      await voting.connect(admin).startVoting();
    });

    it("5.1 Cử tri hợp lệ có thể bỏ phiếu thành công cho ứng cử viên", async function () {
      await voting.connect(voter1).vote(1);
      const v1 = await voting.voters(voter1.address);
      expect(v1.hasVoted).to.be.true;
      expect(v1.votedCandidateId).to.equal(1);
    });

    it("5.2 Phiếu bầu được tích lũy chính xác cho ứng viên và tổng số phiếu", async function () {
      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(2);
      const candidates = await voting.getCandidates();
      expect(candidates[0].voteCount).to.equal(1);
      expect(candidates[1].voteCount).to.equal(1);
      expect(await voting.totalVotes()).to.equal(2);
    });

    it("5.3 Xác định chính xác ứng cử viên có số phiếu cao nhất qua getWinner()", async function () {
      await voting.connect(voter1).vote(2);
      await voting.connect(voter2).vote(2);
      await voting.connect(admin).endVoting();

      const [winnerName, highestVote] = await voting.getWinner();
      expect(winnerName).to.equal("Trần Thị B");
      expect(highestVote).to.equal(2);
    });
  });
});
