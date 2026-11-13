// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Voting (Hệ thống Bình chọn Trực tuyến)
 * Phụ trách: Minh Em - Smart Contract
 */
contract Voting {
    // Tên của cuộc bình chọn
    string public electionName;

    // Hàm khởi tạo - Gán tên cuộc bình chọn khi triển khai
    constructor(string memory _electionName) {
        electionName = _electionName;
    }
}
