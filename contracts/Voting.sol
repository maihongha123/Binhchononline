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

    string public electionName; // Tên cuộc bình chọn

    // Hàm khởi tạo tên cuộc bầu cử khi triển khai
    constructor(string memory _electionName) {
        electionName = _electionName;
    }
}
