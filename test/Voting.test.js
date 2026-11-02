const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KIỂM THỬ TOÀN DIỆN HỆ THỐNG BÌNH CHỌN (VOTING SMART CONTRACT)", function () {
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

  // =================================================================
  // 1. KHỞI TẠO HỢP ĐỒNG
  // =================================================================
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

  // =================================================================
  // 2. QUẢN LÝ ỨNG VIÊN & CỬ TRI (DÀNH CHO ADMIN)
  // =================================================================
  describe("2. Quản lý Ứng viên & Cử tri", function () {
    it("Admin có thể thêm ứng cử viên thành công", async function () {
      await voting.connect(admin).addCandidate("Nguyen Van A");
      await voting.connect(admin).addCandidate("Tran Thi B");

      const candidates = await voting.getCandidates();
      expect(candidates.length).to.equal(2);
      expect(candidates[0].name).to.equal("Nguyen Van A");
      expect(candidates[1].name).to.equal("Tran Thi B");
    });

    it("Không thể thêm ứng cử viên với tên để trống", async function () {
      await expect(
        voting.connect(admin).addCandidate("")
      ).to.be.revertedWith("Ten ung vien khong duoc de trong!");
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

    it("Không thể cấp quyền cho địa chỉ ví rỗng (0x0)", async function () {
      await expect(
        voting.connect(admin).registerVoter(ethers.ZeroAddress)
      ).to.be.revertedWith("Dia chi vi khong hop le!");
    });

    it("Không thể đăng ký cùng 1 cử tri 2 lần", async function () {
      await voting.connect(admin).registerVoter(voter1.address);
      await expect(
        voting.connect(admin).registerVoter(voter1.address)
      ).to.be.revertedWith("Cu tri nay da duoc dang ky truoc do!");
    });
  });

  // =================================================================
  // 3. KIỂM SOÁT PHÂN QUYỀN ADMIN & MÁY TRẠNG THÁI
  // =================================================================
  describe("3. Phân quyền Admin & Máy trạng thái", function () {
    it("Không thể bắt đầu bình chọn nếu có ít hơn 2 ứng cử viên", async function () {
      await voting.connect(admin).addCandidate("Nguyen Van A");
      await expect(
        voting.connect(admin).startVoting()
      ).to.be.revertedWith("Can it nhat 2 ung vien de bat dau cuoc bau cu!");
    });

    it("Người lạ KHÔNG ĐƯỢC PHÉP bắt đầu cuộc bình chọn", async function () {
      await voting.connect(admin).addCandidate("Nguyen Van A");
      await voting.connect(admin).addCandidate("Tran Thi B");
      await expect(
        voting.connect(stranger).startVoting()
      ).to.be.revertedWith("Chi nguoi quan tri (Admin) moi co quyen thuc hien!");
    });

    it("Người lạ KHÔNG ĐƯỢC PHÉP kết thúc cuộc bình chọn", async function () {
      await voting.connect(admin).addCandidate("Nguyen Van A");
      await voting.connect(admin).addCandidate("Tran Thi B");
      await voting.connect(admin).startVoting();
      await expect(
        voting.connect(stranger).endVoting()
      ).to.be.revertedWith("Chi nguoi quan tri (Admin) moi co quyen thuc hien!");
    });
  });

  // =================================================================
  // 4. QUY TRÌNH BÌNH CHỌN & CHỐNG GIAN LẬN
  // =================================================================
  describe("4. Quy trình Bình chọn & Chống gian lận", function () {
    beforeEach(async function () {
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
      await voting.connect(admin).startVoting();
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

    it("Không thể bỏ phiếu cho ứng cử viên không tồn tại (ID không hợp lệ)", async function () {
      await voting.connect(admin).startVoting();
      await expect(
        voting.connect(voter1).vote(999)
      ).to.be.revertedWith("Ma so ung vien khong hop le!");
      await expect(
        voting.connect(voter1).vote(0)
      ).to.be.revertedWith("Ma so ung vien khong hop le!");
    });

    it("Không thể bỏ phiếu sau khi cuộc bầu cử đã kết thúc (Ended)", async function () {
      await voting.connect(admin).startVoting();
      await voting.connect(admin).endVoting();

      await expect(
        voting.connect(voter1).vote(1)
      ).to.be.revertedWith("Chuc nang khong the thuc hien o giai doan nay!");
    });
  });

  // =================================================================
  // 5. KẾT THÚC VÀ CÔNG BỐ KẾT QUẢ
  // =================================================================
  describe("5. Kết thúc và Công bố kết quả", function () {
    beforeEach(async function () {
      await voting.connect(admin).addCandidate("Nguyen Van A");
      await voting.connect(admin).addCandidate("Tran Thi B");
      await voting.connect(admin).registerVoter(voter1.address);
      await voting.connect(admin).registerVoter(voter2.address);
    });

    it("Không thể gọi getWinner() khi cuộc bầu cử chưa kết thúc", async function () {
      await expect(
        voting.getWinner()
      ).to.be.revertedWith("Chuc nang khong the thuc hien o giai doan nay!");
    });

    it("Xác định chính xác ứng cử viên có số phiếu cao nhất", async function () {
      await voting.connect(admin).startVoting();
      await voting.connect(voter1).vote(2);
      await voting.connect(voter2).vote(2);
      await voting.connect(admin).endVoting();

      const [winnerName, highestVote] = await voting.getWinner();
      expect(winnerName).to.equal("Tran Thi B");
      expect(highestVote).to.equal(2);
    });

    it("Tổng số phiếu (totalVotes) và số lượng ứng cử viên được tính toán chính xác", async function () {
      expect(await voting.getCandidatesCount()).to.equal(2);
      await voting.connect(admin).startVoting();
      await voting.connect(voter1).vote(1);
      expect(await voting.totalVotes()).to.equal(1);
    });
  });

  // =================================================================
  // 6. PHÁT SỰ KIỆN (EVENTS)
  // =================================================================
  describe("6. Phát sự kiện (Events)", function () {
    it("Phát sự kiện CandidateAdded khi thêm ứng viên", async function () {
      await expect(voting.connect(admin).addCandidate("Nguyen Van A"))
        .to.emit(voting, "CandidateAdded")
        .withArgs(1, "Nguyen Van A");
    });

    it("Phát sự kiện VoteCasted khi cử tri bỏ phiếu", async function () {
      await voting.connect(admin).addCandidate("Nguyen Van A");
      await voting.connect(admin).addCandidate("Tran Thi B");
      await voting.connect(admin).registerVoter(voter1.address);
      await voting.connect(admin).startVoting();

      await expect(voting.connect(voter1).vote(1))
        .to.emit(voting, "VoteCasted")
        .withArgs(voter1.address, 1);
    });

    it("Phát sự kiện StatusChanged khi thay đổi giai đoạn", async function () {
      await voting.connect(admin).addCandidate("Nguyen Van A");
      await voting.connect(admin).addCandidate("Tran Thi B");

      await expect(voting.connect(admin).startVoting())
        .to.emit(voting, "StatusChanged")
        .withArgs(0, 1);
    });
  });

  // =================================================================
  // 7. KIỂM THỬ ĐA TÀI KHOẢN & TÍCH HỢP WEB3 (PHẦN VIỆC THÀNH VIÊN 2)
  // =================================================================
  describe("7. Tương tác Đa tài khoản & Tích hợp Web3 (Thành viên 2)", function () {
    let accounts;

    beforeEach(async function () {
      // Lấy toàn bộ danh sách các tài khoản ví từ Hardhat
      accounts = await ethers.getSigners();
    });

    it("Mô phỏng 5 cử tri khác nhau kết nối ví và bỏ phiếu đồng thời", async function () {
      // 1. Thêm 3 ứng cử viên
      await voting.connect(admin).addCandidate("Ung vien 1");
      await voting.connect(admin).addCandidate("Ung vien 2");
      await voting.connect(admin).addCandidate("Ung vien 3");

      // 2. Admin cấp quyền cho 5 cử tri (accounts[1] đến accounts[5])
      for (let i = 1; i <= 5; i++) {
        await voting.connect(admin).registerVoter(accounts[i].address);
      }

      // 3. Admin mở hòm phiếu
      await voting.connect(admin).startVoting();

      // 4. Lần lượt 5 ví kết nối và thực hiện giao dịch bỏ phiếu
      // Ví 1, 2, 3 bầu cho Ứng viên 1 (3 phiếu)
      await voting.connect(accounts[1]).vote(1);
      await voting.connect(accounts[2]).vote(1);
      await voting.connect(accounts[3]).vote(1);

      // Ví 4 bầu cho Ứng viên 2 (1 phiếu)
      await voting.connect(accounts[4]).vote(2);

      // Ví 5 bầu cho Ứng viên 3 (1 phiếu)
      await voting.connect(accounts[5]).vote(3);

      // 5. Kiểm tra kết quả tổng hợp on-chain
      expect(await voting.totalVotes()).to.equal(5);

      const candidates = await voting.getCandidates();
      expect(candidates[0].voteCount).to.equal(3); // Ứng viên 1: 3 phiếu
      expect(candidates[1].voteCount).to.equal(1); // Ứng viên 2: 1 phiếu
      expect(candidates[2].voteCount).to.equal(1); // Ứng viên 3: 1 phiếu

      // 6. Kết thúc và công bố người thắng cuộc
      await voting.connect(admin).endVoting();
      const [winnerName, highestVote] = await voting.getWinner();
      expect(winnerName).to.equal("Ung vien 1");
      expect(highestVote).to.equal(3);
    });

    it("Đảm bảo trạng thái cử tri độc lập khi chuyển đổi tài khoản ví (Signer)", async function () {
      await voting.connect(admin).addCandidate("Nguyen Van A");
      await voting.connect(admin).addCandidate("Tran Thi B");
      await voting.connect(admin).registerVoter(voter1.address);
      await voting.connect(admin).registerVoter(voter2.address);
      await voting.connect(admin).startVoting();

      // voter1 bỏ phiếu
      await voting.connect(voter1).vote(1);

      // Kiểm tra trạng thái: voter1 đã vote, voter2 chưa vote
      const voter1Data = await voting.voters(voter1.address);
      const voter2Data = await voting.voters(voter2.address);

      expect(voter1Data.hasVoted).to.be.true;
      expect(voter1Data.votedCandidateId).to.equal(1);
      expect(voter2Data.hasVoted).to.be.false;

      // Khi voter2 kết nối ví, voter2 vẫn có thể bỏ phiếu bình thường
      await voting.connect(voter2).vote(2);
      const voter2DataAfter = await voting.voters(voter2.address);
      expect(voter2DataAfter.hasVoted).to.be.true;
      expect(voter2DataAfter.votedCandidateId).to.equal(2);
    });

    it("Chặn chính xác khi tài khoản chưa cấp quyền xen lẫn tài khoản hợp lệ", async function () {
      await voting.connect(admin).addCandidate("Nguyen Van A");
      await voting.connect(admin).addCandidate("Tran Thi B");
      await voting.connect(admin).registerVoter(voter1.address);
      // stranger KHÔNG được cấp quyền
      await voting.connect(admin).startVoting();

      // voter1 hợp lệ -> vote thành công
      await expect(voting.connect(voter1).vote(1)).to.not.be.reverted;

      // stranger cố tình vote -> bị revert đúng câu thông báo
      await expect(
        voting.connect(stranger).vote(1)
      ).to.be.revertedWith("Ban khong co ten trong danh sach duoc phep bo phieu!");
    });
  });
});
