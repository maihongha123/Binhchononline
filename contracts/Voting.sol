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
}
