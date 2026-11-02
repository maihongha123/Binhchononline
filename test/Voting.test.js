const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KIỂM THỬ HỆ THỐNG BÌNH CHỌN (VOTING SMART CONTRACT)", function () {
  let voting;
  let admin, voter1, voter2, stranger;

  beforeEach(async function () {
    // Lấy các tài khoản ví giả lập từ môi trường Hardhat
    [admin, voter1, voter2, stranger] = await ethers.getSigners();

    // Deploy hợp đồng mới trước mỗi bài test
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy("Bầu cử Đại Biểu Sinh Viên");
    await voting.waitForDeployment();
  });

  describe("1. Khởi tạo hợp đồng", function () {
    it("Người triển khai hợp đồng phải là Quản trị viên (Admin)", async function () {
      expect(await voting.admin()).to.equal(admin.address);
    });

    it("Tên cuộc bầu cử phải được thiết lập chính xác", async function () {
      expect(await voting.electionName()).to.equal("Bầu cử Đại Biểu Sinh Viên");
    });

    it("Trạng thái ban đầu phải là Registering (0)", async function () {
      expect(await voting.currentStatus()).to.equal(0);
    });
  });

  describe("2. Quản lý Ứng viên & Cử tri (Dành cho Admin)", function () {
    it("Admin có thể thêm ứng cử viên thành công", async function () {
      await voting.connect(admin).addCandidate("Nguyen Van A");
      await voting.connect(admin).addCandidate("Tran Thi B");

      const candidates = await voting.getCandidates();
      expect(candidates.length).to.equal(2);
      expect(candidates[0].name).to.equal("Nguyen Van A");
      expect(candidates[1].name).to.equal("Tran Thi B");
    });

    it("Người không phải Admin KHÔNG ĐƯỢC PHÉP thêm ứng cử viên", async function () {
      await expect(
        voting.connect(stranger).addCandidate("Le Van Hack")
      ).to.be.revertedWith("Chi nguoi quan tri (Admin) moi co quyen thuc hien!");
    });

    it("Admin có thể cấp quyền (đăng ký) cho cử tri", async function () {
      await voting.connect(admin).registerVoter(voter1.address);
      const v1 = await voting.voters(voter1.address);
      expect(v1.isRegistered).to.be.true;
      expect(v1.hasVoted).to.be.false;
    });

    it("Không thể đăng ký cùng 1 cử tri 2 lần", async function () {
      await voting.connect(admin).registerVoter(voter1.address);
      await expect(
        voting.connect(admin).registerVoter(voter1.address)
      ).to.be.revertedWith("Cu tri nay da duoc dang ky truoc do!");
    });
  });

  describe("3. Quy trình Bình chọn (Voting Flow)", function () {
    beforeEach(async function () {
      // Chuẩn bị dữ liệu ban đầu
      await voting.connect(admin).addCandidate("Nguyen Van A");
      await voting.connect(admin).addCandidate("Tran Thi B");
      await voting.connect(admin).registerVoter(voter1.address);
      await voting.connect(admin).registerVoter(voter2.address);
    });

    it("Không thể bỏ phiếu khi chưa chuyển sang trạng thái Voting", async function () {
      await expect(
        voting.connect(voter1).vote(1)
      ).to.be.revertedWith("Chuc nang khong the thuc hien o giai doan nay!");
    });

    it("Cử tri hợp lệ có thể bỏ phiếu khi trạng thái là Voting", async function () {
      // Admin bắt đầu cuộc bầu cử
      await voting.connect(admin).startVoting();

      // voter1 bỏ phiếu cho ứng viên 1 (Nguyen Van A)
      await voting.connect(voter1).vote(1);

      const candidates = await voting.getCandidates();
      expect(candidates[0].voteCount).to.equal(1);

      const v1 = await voting.voters(voter1.address);
      expect(v1.hasVoted).to.be.true;
      expect(v1.votedCandidateId).to.equal(1);
    });

    it("Một cử tri KHÔNG THỂ bỏ phiếu 2 lần (Chống gian lận phiếu)", async function () {
      await voting.connect(admin).startVoting();

      await voting.connect(voter1).vote(1);

      await expect(
        voting.connect(voter1).vote(2)
      ).to.be.revertedWith("Ban da bo phieu roi, khong the bo phieu lai!");
    });

    it("Người lạ chưa được cấp quyền KHÔNG ĐƯỢC PHÉP bỏ phiếu", async function () {
      await voting.connect(admin).startVoting();

      await expect(
        voting.connect(stranger).vote(1)
      ).to.be.revertedWith("Ban khong co ten trong danh sach duoc phep bo phieu!");
    });
  });

  describe("4. Kết thúc và Công bố người chiến thắng", function () {
    it("Xác định chính xác ứng cử viên có số phiếu cao nhất", async function () {
      await voting.connect(admin).addCandidate("Nguyen Van A");
      await voting.connect(admin).addCandidate("Tran Thi B");
      await voting.connect(admin).registerVoter(voter1.address);
      await voting.connect(admin).registerVoter(voter2.address);

      await voting.connect(admin).startVoting();

      // voter1 và voter2 đều bầu cho Tran Thi B (Candidate ID 2)
      await voting.connect(voter1).vote(2);
      await voting.connect(voter2).vote(2);

      // Kết thúc bỏ phiếu
      await voting.connect(admin).endVoting();

      const [winnerName, highestVote] = await voting.getWinner();
      expect(winnerName).to.equal("Tran Thi B");
      expect(highestVote).to.equal(2);
    });
  });
});
