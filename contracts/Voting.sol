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
}
