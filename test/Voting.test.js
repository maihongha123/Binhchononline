const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * BỘ KIỂM THỬ TOÀN DIỆN SMART CONTRACT VOTING
 * Phụ trách: Minh Em - Smart Contract & Core Logic Engineer
 * Mục tiêu: 34 Unit Test cases (29 tests nghiệp vụ chuẩn & bảo mật + 5 tests chuyên sâu thuật toán hòa phiếu)
 */
describe("BỘ KIỂM THỬ TOÀN DIỆN HỆ THỐNG BÌNH CHỌN (34 TEST CASES)", function () {
  let voting;
  let admin, voter1, voter2, voter3, voter4, voter5, stranger;

  beforeEach(async function () {
    // Lấy danh sách ví giả lập từ môi trường Hardhat (tối thiểu 7 ví phục vụ các kịch bản phân bổ phiếu)
    [admin, voter1, voter2, voter3, voter4, voter5, stranger] = await ethers.getSigners();

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
  // 5. BỎ PHIẾU HỢP LỆ & XEM KẾT QUẢ CƠ BẢN (5 TEST CASES)
  // =================================================================
  describe("5. Bỏ phiếu Hợp lệ & Xem Kết quả (Xử lý Hòa phiếu Cơ bản)", function () {
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

    it("5.4 Xác định chính xác kết quả hòa (Tie) khi các ứng viên bằng số phiếu cao nhất", async function () {
      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(2);
      await voting.connect(admin).endVoting();

      const [winnerName, highestVote] = await voting.getWinner();
      expect(winnerName).to.equal("Ket qua hoa (Tie)");
      expect(highestVote).to.equal(1);
    });

    it("5.5 Trả về kết quả phù hợp khi cuộc bầu cử kết thúc mà không có ai bỏ phiếu", async function () {
      await voting.connect(admin).endVoting();

      const [winnerName, highestVote] = await voting.getWinner();
      expect(winnerName).to.equal("Khong co phieu bau");
      expect(highestVote).to.equal(0);
    });
  });

  // =================================================================
  // 6. BẢO MẬT PHÂN QUYỀN ADMIN & ĐẦU VÀO (4 TEST CASES)
  // =================================================================
  describe("6. Bảo mật Phân quyền Admin & Dữ liệu Đầu vào", function () {
    it("6.1 Chặn tài khoản lạ không phải Admin cố tình thêm ứng viên", async function () {
      await expect(
        voting.connect(stranger).addCandidate("Kẻ Xâm Nhập")
      ).to.be.revertedWith("Chi nguoi quan tri (Admin) moi co quyen thuc hien!");
    });

    it("6.2 Chặn thêm ứng cử viên với tên rỗng", async function () {
      await expect(
        voting.connect(admin).addCandidate("")
      ).to.be.revertedWith("Ten ung vien khong duoc de trong!");
    });

    it("6.3 Chặn cấp quyền cử tri cho địa chỉ ví rỗng (0x0)", async function () {
      await expect(
        voting.connect(admin).registerVoter(ethers.ZeroAddress)
      ).to.be.revertedWith("Dia chi vi khong hop le!");
    });

    it("6.4 Chặn cấp quyền hai lần cho cùng một địa chỉ ví cử tri", async function () {
      await voting.connect(admin).registerVoter(voter1.address);
      await expect(
        voting.connect(admin).registerVoter(voter1.address)
      ).to.be.revertedWith("Cu tri nay da duoc dang ky truoc do!");
    });
  });

  // =================================================================
  // 7. KIỂM SOÁT QUY TRÌNH & MÁY TRẠNG THÁI (3 TEST CASES)
  // =================================================================
  describe("7. Kiểm soát Quy trình & Máy trạng thái", function () {
    it("7.1 Chặn mở hòm phiếu khi chưa có đủ tối thiểu 2 ứng cử viên", async function () {
      await voting.connect(admin).addCandidate("Nguyễn Văn A");
      await expect(
        voting.connect(admin).startVoting()
      ).to.be.revertedWith("Can it nhat 2 ung vien de bat dau cuoc bau cu!");
    });

    it("7.2 Chặn tài khoản lạ cố tình gọi mở hoặc đóng hòm phiếu", async function () {
      await voting.connect(admin).addCandidate("Nguyễn Văn A");
      await voting.connect(admin).addCandidate("Trần Thị B");

      await expect(
        voting.connect(stranger).startVoting()
      ).to.be.revertedWith("Chi nguoi quan tri (Admin) moi co quyen thuc hien!");
    });

    it("7.3 Chặn gọi getWinner() để xem kết quả khi cuộc bầu cử chưa kết thúc", async function () {
      await voting.connect(admin).addCandidate("Nguyễn Văn A");
      await voting.connect(admin).addCandidate("Trần Thị B");
      await voting.connect(admin).startVoting();

      await expect(
        voting.getWinner()
      ).to.be.revertedWith("Chuc nang khong the thuc hien o giai doan nay!");
    });
  });

  // =================================================================
  // 8. BẢO MẬT BỎ PHIẾU & CHỐNG GIAN LẬN (5 TEST CASES)
  // =================================================================
  describe("8. Bảo mật Bỏ phiếu & Chống Gian lận", function () {
    beforeEach(async function () {
      await voting.connect(admin).addCandidate("Nguyễn Văn A");
      await voting.connect(admin).addCandidate("Trần Thị B");
      await voting.connect(admin).registerVoter(voter1.address);
      await voting.connect(admin).registerVoter(voter2.address);
    });

    it("8.1 Chặn bỏ phiếu khi cuộc bầu cử chưa mở (đang ở giai đoạn Registering)", async function () {
      await expect(
        voting.connect(voter1).vote(1)
      ).to.be.revertedWith("Chuc nang khong the thuc hien o giai doan nay!");
    });

    it("8.2 Chặn người lạ chưa được cấp quyền tham gia bỏ phiếu", async function () {
      await voting.connect(admin).startVoting();
      await expect(
        voting.connect(stranger).vote(1)
      ).to.be.revertedWith("Ban khong co ten trong danh sach duoc phep bo phieu!");
    });

    it("8.3 Chặn cử tri bỏ phiếu lần thứ hai (Anti-double voting)", async function () {
      await voting.connect(admin).startVoting();
      await voting.connect(voter1).vote(1);

      await expect(
        voting.connect(voter1).vote(1)
      ).to.be.revertedWith("Ban da bo phieu roi, khong the bo phieu lai!");
    });

    it("8.4 Chặn bỏ phiếu cho mã số ứng cử viên không tồn tại (ID 0 hoặc ID vượt quá)", async function () {
      await voting.connect(admin).startVoting();

      await expect(
        voting.connect(voter1).vote(0)
      ).to.be.revertedWith("Ma so ung vien khong hop le!");

      await expect(
        voting.connect(voter1).vote(999)
      ).to.be.revertedWith("Ma so ung vien khong hop le!");
    });

    it("8.5 Chặn bỏ phiếu sau khi cuộc bầu cử đã kết thúc (Ended)", async function () {
      await voting.connect(admin).startVoting();
      await voting.connect(admin).endVoting();

      await expect(
        voting.connect(voter1).vote(1)
      ).to.be.revertedWith("Chuc nang khong the thuc hien o giai doan nay!");
    });
  });

  // =================================================================
  // 9. CHUYÊN SÂU THUẬT TOÁN HÒA PHIẾU & BIÊN PHỨC TẠP (5 TEST CASES NÂNG CAO)
  // =================================================================
  describe("9. Chuyên sâu Thuật toán Xác định Người thắng cuộc & Hòa phiếu", function () {
    it("9.1 Hòa phiếu tay ba (3-way tie) khi cả 3 ứng cử viên đều có số phiếu bằng nhau (1 - 1 - 1)", async function () {
      await voting.connect(admin).addCandidate("Ứng viên 1");
      await voting.connect(admin).addCandidate("Ứng viên 2");
      await voting.connect(admin).addCandidate("Ứng viên 3");
      await voting.connect(admin).registerVoter(voter1.address);
      await voting.connect(admin).registerVoter(voter2.address);
      await voting.connect(admin).registerVoter(voter3.address);
      await voting.connect(admin).startVoting();

      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(2);
      await voting.connect(voter3).vote(3);
      await voting.connect(admin).endVoting();

      const [winnerName, highestVote] = await voting.getWinner();
      expect(winnerName).to.equal("Ket qua hoa (Tie)");
      expect(highestVote).to.equal(1);
    });

    it("9.2 Hòa phiếu giữa 2 ứng viên dẫn đầu trong cuộc đua có ứng viên thứ ba ít phiếu hơn (2 - 2 - 1)", async function () {
      await voting.connect(admin).addCandidate("Ứng viên 1");
      await voting.connect(admin).addCandidate("Ứng viên 2");
      await voting.connect(admin).addCandidate("Ứng viên 3");
      await voting.connect(admin).registerVoter(voter1.address);
      await voting.connect(admin).registerVoter(voter2.address);
      await voting.connect(admin).registerVoter(voter3.address);
      await voting.connect(admin).registerVoter(voter4.address);
      await voting.connect(admin).registerVoter(voter5.address);
      await voting.connect(admin).startVoting();

      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(1);
      await voting.connect(voter3).vote(2);
      await voting.connect(voter4).vote(2);
      await voting.connect(voter5).vote(3);
      await voting.connect(admin).endVoting();

      const [winnerName, highestVote] = await voting.getWinner();
      expect(winnerName).to.equal("Ket qua hoa (Tie)");
      expect(highestVote).to.equal(2);
    });

    it("9.3 Thắng sát nút khi ứng viên dẫn đầu hơn đúng 1 phiếu so với các ứng viên còn lại (2 - 1 - 1)", async function () {
      await voting.connect(admin).addCandidate("Ứng viên 1");
      await voting.connect(admin).addCandidate("Ứng viên 2");
      await voting.connect(admin).addCandidate("Ứng viên 3");
      await voting.connect(admin).registerVoter(voter1.address);
      await voting.connect(admin).registerVoter(voter2.address);
      await voting.connect(admin).registerVoter(voter3.address);
      await voting.connect(admin).registerVoter(voter4.address);
      await voting.connect(admin).startVoting();

      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(1);
      await voting.connect(voter3).vote(2);
      await voting.connect(voter4).vote(3);
      await voting.connect(admin).endVoting();

      const [winnerName, highestVote] = await voting.getWinner();
      expect(winnerName).to.equal("Ứng viên 1");
      expect(highestVote).to.equal(2);
    });

    it("9.4 Ứng cử viên nằm ở cuối danh sách đắc cử nhằm loại trừ hoàn toàn định kiến vị trí mảng", async function () {
      await voting.connect(admin).addCandidate("Ứng viên Đầu");
      await voting.connect(admin).addCandidate("Ứng viên Giữa");
      await voting.connect(admin).addCandidate("Ứng viên Cuối");
      await voting.connect(admin).registerVoter(voter1.address);
      await voting.connect(admin).registerVoter(voter2.address);
      await voting.connect(admin).startVoting();

      await voting.connect(voter1).vote(3);
      await voting.connect(voter2).vote(3);
      await voting.connect(admin).endVoting();

      const [winnerName, highestVote] = await voting.getWinner();
      expect(winnerName).to.equal("Ứng viên Cuối");
      expect(highestVote).to.equal(2);
    });

    it("9.5 Cuộc bầu cử chỉ có duy nhất 1 phiếu bầu xác định đúng người thắng và không hòa với ứng viên 0 phiếu", async function () {
      await voting.connect(admin).addCandidate("Ứng viên A");
      await voting.connect(admin).addCandidate("Ứng viên B");
      await voting.connect(admin).registerVoter(voter1.address);
      await voting.connect(admin).startVoting();

      await voting.connect(voter1).vote(1);
      await voting.connect(admin).endVoting();

      const [winnerName, highestVote] = await voting.getWinner();
      expect(winnerName).to.equal("Ứng viên A");
      expect(highestVote).to.equal(1);
    });
  });
});
