// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Voting (Hệ thống Bình chọn Trực tuyến)
 * @dev Hợp đồng thông minh phục vụ đồ án môn Blockchain cơ bản.
 * Đảm bảo: minh bạch, mỗi cử tri chỉ được bỏ 1 phiếu, không thể gian lận hay sửa đổi kết quả.
 */
contract Voting {
    // ==========================================
    // 1. CẤU TRÚC DỮ LIỆU (STRUCTS)
    // ==========================================

    // Cấu trúc đại diện cho một Ứng viên
    struct Candidate {
        uint256 id;        // Mã số định danh của ứng viên (1, 2, 3...)
        string name;       // Họ và tên ứng viên
        uint256 voteCount; // Số phiếu bầu nhận được
    }

    // Cấu trúc đại diện cho một Cử tri (Người tham gia bình chọn)
    struct Voter {
        bool isRegistered;     // Đã được cấp quyền/đăng ký bỏ phiếu hay chưa
        bool hasVoted;        // Đã thực hiện bỏ phiếu hay chưa
        uint256 votedCandidateId; // Mã số ứng viên mà cử tri này đã bầu
    }

    // Trạng thái của cuộc bình chọn
    enum WorkflowStatus {
        Registering, // Giai đoạn đăng ký cử tri & ứng cử viên
        Voting,      // Giai đoạn đang diễn ra bình chọn
        Ended        // Đã kết thúc và công bố kết quả
    }

    // ==========================================
    // 2. BIẾN TRẠNG THÁI (STATE VARIABLES)
    // ==========================================

    address public admin;                  // Địa chỉ ví của người quản trị (Chủ trì cuộc bầu cử)
    string public electionName;            // Tên cuộc bầu cử (Ví dụ: "Bầu cử Lớp trưởng 2026")
    WorkflowStatus public currentStatus;   // Trạng thái hiện tại của cuộc bầu cử

    // Danh sách các ứng viên tham gia
    Candidate[] public candidates;

    // Lưu trữ thông tin từng cử tri dựa trên địa chỉ ví (Address => Voter)
    mapping(address => Voter) public voters;

    // Tổng số phiếu đã bỏ hợp lệ
    uint256 public totalVotes;

    // ==========================================
    // 3. SỰ KIỆN (EVENTS)
    // ==========================================
    // Dùng để frontend (Web UI) lắng nghe sự kiện khi blockchain ghi nhận thay đổi
    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoterRegistered(address indexed voterAddress);
    event StatusChanged(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event VoteCasted(address indexed voter, uint256 indexed candidateId);

    // ==========================================
    // 4. BỘ ĐIỀU KIỆN (MODIFIERS)
    // ==========================================

    // Chỉ cho phép admin gọi hàm
    modifier onlyAdmin() {
        require(msg.sender == admin, "Chi nguoi quan tri (Admin) moi co quyen thuc hien!");
        _;
    }

    // Kiểm tra giai đoạn hiện tại của cuộc bầu cử
    modifier checkStatus(WorkflowStatus _status) {
        require(currentStatus == _status, "Chuc nang khong the thuc hien o giai doan nay!");
        _;
    }

    // ==========================================
    // 5. HÀM KHỞI TẠO (CONSTRUCTOR)
    // ==========================================
    constructor(string memory _electionName) {
        admin = msg.sender; // Người deploy contract sẽ là Admin
        electionName = _electionName;
        currentStatus = WorkflowStatus.Registering; // Khởi đầu bằng giai đoạn đăng ký
    }

    // ==========================================
    // 6. CÁC HÀM QUẢN TRỊ (DÀNH CHO ADMIN)
    // ==========================================

    /**
     * @dev Thêm ứng cử viên mới vào danh sách.
     * @param _name Tên ứng cử viên.
     */
    function addCandidate(string memory _name) 
        external 
        onlyAdmin 
        checkStatus(WorkflowStatus.Registering) 
    {
        require(bytes(_name).length > 0, "Ten ung vien khong duoc de trong!");

        uint256 newId = candidates.length + 1; // ID bắt đầu từ 1
        candidates.push(Candidate({
            id: newId,
            name: _name,
            voteCount: 0
        }));

        emit CandidateAdded(newId, _name);
    }

    /**
     * @dev Cấp quyền bỏ phiếu cho một cử tri (theo địa chỉ ví).
     * @param _voter Địa chỉ ví của cử tri cần cấp quyền.
     */
    function registerVoter(address _voter) 
        external 
        onlyAdmin 
        checkStatus(WorkflowStatus.Registering) 
    {
        require(_voter != address(0), "Dia chi vi khong hop le!");
        require(!voters[_voter].isRegistered, "Cu tri nay da duoc dang ky truoc do!");

        voters[_voter].isRegistered = true;
        voters[_voter].hasVoted = false;
        voters[_voter].votedCandidateId = 0;

        emit VoterRegistered(_voter);
    }

    /**
     * @dev Chuyển sang giai đoạn Bắt đầu bỏ phiếu.
     */
    function startVoting() 
        external 
        onlyAdmin 
        checkStatus(WorkflowStatus.Registering) 
    {
        require(candidates.length >= 2, "Can it nhat 2 ung vien de bat dau cuoc bau cu!");
        currentStatus = WorkflowStatus.Voting;
        emit StatusChanged(WorkflowStatus.Registering, WorkflowStatus.Voting);
    }

    /**
     * @dev Kết thúc cuộc bỏ phiếu và đóng hòm phiếu.
     */
    function endVoting() 
        external 
        onlyAdmin 
        checkStatus(WorkflowStatus.Voting) 
    {
        currentStatus = WorkflowStatus.Ended;
        emit StatusChanged(WorkflowStatus.Voting, WorkflowStatus.Ended);
    }

    // ==========================================
    // 7. CÁC HÀM DÀNH CHO CỬ TRI VÀ CỘNG ĐỒNG
    // ==========================================

    /**
     * @dev Bỏ phiếu cho một ứng viên theo ID.
     * @param _candidateId Mã số ứng cử viên muốn bình chọn.
     */
    function vote(uint256 _candidateId) 
        external 
        checkStatus(WorkflowStatus.Voting) 
    {
        Voter storage sender = voters[msg.sender];

        require(sender.isRegistered, "Ban khong co ten trong danh sach duoc phep bo phieu!");
        require(!sender.hasVoted, "Ban da bo phieu roi, khong the bo phieu lai!");
        require(_candidateId > 0 && _candidateId <= candidates.length, "Ma so ung vien khong hop le!");

        // Đánh dấu đã bỏ phiếu
        sender.hasVoted = true;
        sender.votedCandidateId = _candidateId;

        // Tăng số phiếu cho ứng cử viên
        // candidates là mảng bắt đầu từ index 0 nên vị trí là _candidateId - 1
        candidates[_candidateId - 1].voteCount += 1;
        totalVotes += 1;

        emit VoteCasted(msg.sender, _candidateId);
    }

    /**
     * @dev Lấy toàn bộ danh sách ứng cử viên để hiển thị lên giao diện.
     */
    function getCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    /**
     * @dev Đếm tổng số ứng viên hiện có.
     */
    function getCandidatesCount() external view returns (uint256) {
        return candidates.length;
    }

    /**
     * @dev Tìm người thắng cuộc sau khi kết thúc bầu cử.
     * @return winnerName Tên của ứng viên có số phiếu cao nhất.
     * @return highestVote Số phiếu cao nhất đạt được.
     */
    function getWinner() 
        external 
        view 
        checkStatus(WorkflowStatus.Ended) 
        returns (string memory winnerName, uint256 highestVote) 
    {
        uint256 winningVoteCount = 0;
        uint256 winningCandidateIndex = 0;

        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > winningVoteCount) {
                winningVoteCount = candidates[i].voteCount;
                winningCandidateIndex = i;
            }
        }

        winnerName = candidates[winningCandidateIndex].name;
        highestVote = winningVoteCount;
    }
}
