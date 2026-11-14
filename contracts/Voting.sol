// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Voting (Hệ thống Bình chọn Trực tuyến)
 * Phụ trách: Minh Em - Smart Contract
 */
contract Voting {
    // Cấu trúc thông tin ứng viên
    struct Candidate {
        uint256 id;        // Mã định danh ứng viên (1, 2, 3...)
        string name;       // Họ và tên ứng viên
        uint256 voteCount; // Số phiếu bầu nhận được
    }

    // Cấu trúc thông tin cử tri
    struct Voter {
        bool isRegistered;        // Đã được cấp quyền bỏ phiếu hay chưa
        bool hasVoted;           // Đã bỏ phiếu hay chưa (chống bầu 2 lần)
        uint256 votedCandidateId; // Mã ứng viên đã bầu
    }

    // Máy trạng thái 3 giai đoạn của cuộc bầu cử
    enum WorkflowStatus {
        Registering, // 0: Đăng ký ứng viên và cử tri
        Voting,      // 1: Đang diễn ra bỏ phiếu
        Ended        // 2: Kết thúc và xem kết quả
    }

    // Biến trạng thái lưu trữ trên Blockchain (State Storage)
    address public admin;                  // Địa chỉ ví người quản trị
    string public electionName;            // Tên cuộc bình chọn
    WorkflowStatus public currentStatus;   // Trạng thái hiện tại của cuộc bầu cử

    Candidate[] public candidates;           // Danh sách ứng cử viên
    mapping(address => Voter) public voters; // Tra cứu thông tin cử tri theo địa chỉ ví
    uint256 public totalVotes;               // Tổng số phiếu bầu hợp lệ

    // 4 sự kiện On-Chain phát tín hiệu cho Web3 Frontend đồng bộ thời gian thực
    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoterRegistered(address indexed voterAddress);
    event StatusChanged(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event VoteCasted(address indexed voter, uint256 indexed candidateId);

    // Bộ điều kiện kiểm tra chỉ cho phép người quản trị thực hiện
    modifier onlyAdmin() {
        require(msg.sender == admin, "Chi nguoi quan tri (Admin) moi co quyen thuc hien!");
        _;
    }

    // Bộ điều kiện kiểm tra giai đoạn thực hiện hợp lệ
    modifier checkStatus(WorkflowStatus _status) {
        require(currentStatus == _status, "Chuc nang khong the thuc hien o giai doan nay!");
        _;
    }

    // Hàm khởi tạo - Thiết lập Admin và tên cuộc bầu cử
    constructor(string memory _electionName) {
        admin = msg.sender;
        electionName = _electionName;
        currentStatus = WorkflowStatus.Registering;
    }

    // Thêm một ứng cử viên mới vào danh sách
    function addCandidate(string memory _name) 
        external 
        onlyAdmin 
        checkStatus(WorkflowStatus.Registering) 
    {
        require(bytes(_name).length > 0, "Ten ung vien khong duoc de trong!");

        uint256 id = candidates.length + 1;
        candidates.push(Candidate({
            id: id,
            name: _name,
            voteCount: 0
        }));

        emit CandidateAdded(id, _name);
    }

    // Cấp quyền bỏ phiếu cho một địa chỉ ví cử tri
    function registerVoter(address _voter) 
        external 
        onlyAdmin 
        checkStatus(WorkflowStatus.Registering) 
    {
        require(_voter != address(0), "Dia chi vi khong hop le!");
        require(!voters[_voter].isRegistered, "Cu tri nay da duoc dang ky truoc do!");

        voters[_voter].isRegistered = true;

        emit VoterRegistered(_voter);
    }

    // Mở hòm phiếu để bắt đầu bình chọn
    function startVoting() 
        external 
        onlyAdmin 
        checkStatus(WorkflowStatus.Registering) 
    {
        require(candidates.length >= 2, "Can it nhat 2 ung vien de bat dau cuoc bau cu!");
        currentStatus = WorkflowStatus.Voting;
        emit StatusChanged(WorkflowStatus.Registering, WorkflowStatus.Voting);
    }

    // Đóng hòm phiếu và kết thúc cuộc bầu cử
    function endVoting() 
        external 
        onlyAdmin 
        checkStatus(WorkflowStatus.Voting) 
    {
        currentStatus = WorkflowStatus.Ended;
        emit StatusChanged(WorkflowStatus.Voting, WorkflowStatus.Ended);
    }

    // Cử tri thực hiện bỏ phiếu cho một ứng viên (Chuẩn Checks-Effects-Interactions)
    function vote(uint256 _candidateId) 
        external 
        checkStatus(WorkflowStatus.Voting) 
    {
        Voter storage sender = voters[msg.sender];

        // 1. Checks: Kiểm tra điều kiện hợp lệ
        require(sender.isRegistered, "Ban khong co ten trong danh sach duoc phep bo phieu!");
        require(!sender.hasVoted, "Ban da bo phieu roi, khong the bo phieu lai!");
        require(_candidateId > 0 && _candidateId <= candidates.length, "Ma so ung vien khong hop le!");

        // 2. Effects: Cập nhật trạng thái cử tri và số phiếu
        sender.hasVoted = true;
        sender.votedCandidateId = _candidateId;
        candidates[_candidateId - 1].voteCount += 1;
        totalVotes += 1;

        // 3. Interactions: Phát sự kiện ra Blockchain
        emit VoteCasted(msg.sender, _candidateId);
    }

    // Lấy toàn bộ danh sách ứng cử viên để hiển thị lên giao diện (miễn phí Gas)
    function getCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    // Lấy tổng số lượng ứng cử viên
    function getCandidatesCount() external view returns (uint256) {
        return candidates.length;
    }

    // Xác định ứng cử viên có số phiếu cao nhất khi cuộc bầu cử kết thúc (Thuật toán 2 bước xử lý hòa phiếu)
    function getWinner() 
        external 
        view 
        checkStatus(WorkflowStatus.Ended) 
        returns (string memory winnerName, uint256 highestVote) 
    {
        // Trường hợp 0: Chưa có bất kỳ phiếu bầu nào được ghi nhận
        if (totalVotes == 0) {
            return ("Khong co phieu bau", 0);
        }

        // Bước 1: Quét tìm số phiếu cao nhất trong danh sách ứng cử viên
        uint256 maxVotes = 0;
        uint256 winningIndex = 0;

        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winningIndex = i;
            }
        }

        // Bước 2: Đếm số lượng ứng cử viên cùng đạt số phiếu cao nhất
        uint256 tieCount = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount == maxVotes) {
                tieCount++;
            }
        }

        // Nếu có từ 2 ứng viên trở lên cùng đạt số phiếu cao nhất -> Bất phân thắng bại (Hòa)
        if (tieCount > 1) {
            return ("Ket qua hoa (Tie)", maxVotes);
        }

        // Nếu chỉ có duy nhất 1 ứng viên đạt số phiếu cao nhất -> Người đắc cử
        return (candidates[winningIndex].name, maxVotes);
    }
}
