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

    // Cấu trúc thông tin của mỗi cuộc bình chọn (Phase 10 - Multi-Poll)
    struct PollInfo {
        uint256 id;            // Mã định danh cuộc bình chọn (1, 2, 3...)
        string title;          // Tiêu đề cuộc bình chọn
        WorkflowStatus status; // Trạng thái hiện tại của cuộc bình chọn
        uint256 totalVotes;    // Tổng số phiếu bầu hợp lệ
    }

    // Biến trạng thái lưu trữ trên Blockchain (State Storage)
    address public admin;                                             // Địa chỉ ví người quản trị
    uint256 public pollCount;                                         // Tổng số cuộc bình chọn đã tạo
    uint256 public activePollId;                                      // Mã cuộc bình chọn đang kích hoạt
    mapping(uint256 => PollInfo) public polls;                        // Thông tin các cuộc bình chọn theo ID
    mapping(uint256 => Candidate[]) private pollCandidates;           // Danh sách ứng viên riêng từng poll
    mapping(uint256 => mapping(address => Voter)) private pollVoters; // Thông tin cử tri riêng từng poll

    // Các sự kiện On-Chain phát tín hiệu cho Web3 Frontend đồng bộ thời gian thực
    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoterRegistered(address indexed voterAddress);
    event StatusChanged(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event VoteCasted(address indexed voter, uint256 indexed candidateId);
    event PollCreated(uint256 indexed pollId, string title);
    event PollSwitched(uint256 indexed previousPollId, uint256 indexed newPollId);

    // Bộ điều kiện kiểm tra chỉ cho phép người quản trị thực hiện
    modifier onlyAdmin() {
        require(msg.sender == admin, "Chi nguoi quan tri (Admin) moi co quyen thuc hien!");
        _;
    }

    // Bộ điều kiện kiểm tra giai đoạn thực hiện hợp lệ của poll đang kích hoạt
    modifier checkStatus(WorkflowStatus _status) {
        require(polls[activePollId].status == _status, "Chuc nang khong the thuc hien o giai doan nay!");
        _;
    }

    // Hàm khởi tạo - Thiết lập Admin và cuộc bình chọn mặc định #1
    constructor(string memory _electionName) {
        admin = msg.sender;
        pollCount = 1;
        activePollId = 1;
        polls[1] = PollInfo({
            id: 1,
            title: _electionName,
            status: WorkflowStatus.Registering,
            totalVotes: 0
        });
    }

    // Tạo thêm một cuộc bình chọn mới độc lập (Phase 10 - Multi-Poll)
    function createPoll(string memory _title) external onlyAdmin returns (uint256) {
        require(bytes(_title).length > 0, "Tieu de cuoc binh chon khong duoc de trong!");

        pollCount += 1;
        polls[pollCount] = PollInfo({
            id: pollCount,
            title: _title,
            status: WorkflowStatus.Registering,
            totalVotes: 0
        });

        emit PollCreated(pollCount, _title);
        return pollCount;
    }

    // Chuyển đổi cuộc bình chọn đang kích hoạt (Phase 10 - Multi-Poll)
    function switchPoll(uint256 _pollId) external onlyAdmin {
        require(_pollId > 0 && _pollId <= pollCount, "Poll khong ton tai!");

        uint256 previousPollId = activePollId;
        activePollId = _pollId;
        emit PollSwitched(previousPollId, _pollId);
    }

    // Lấy toàn bộ danh sách các cuộc bình chọn đã tạo (Phase 10 - Multi-Poll)
    function getPolls() external view returns (PollInfo[] memory) {
        PollInfo[] memory list = new PollInfo[](pollCount);
        for (uint256 i = 1; i <= pollCount; i++) {
            list[i - 1] = polls[i];
        }
        return list;
    }

    // Các hàm truy vấn thông tin cuộc bình chọn đang kích hoạt (giữ nguyên ABI cũ)
    function electionName() external view returns (string memory) {
        return polls[activePollId].title;
    }

    function currentStatus() external view returns (WorkflowStatus) {
        return polls[activePollId].status;
    }

    function totalVotes() external view returns (uint256) {
        return polls[activePollId].totalVotes;
    }

    function voters(address _voter)
        external
        view
        returns (bool isRegistered, bool hasVoted, uint256 votedCandidateId)
    {
        Voter storage v = pollVoters[activePollId][_voter];
        return (v.isRegistered, v.hasVoted, v.votedCandidateId);
    }

    // Thêm một ứng cử viên mới vào danh sách
    function addCandidate(string memory _name) 
        external 
        onlyAdmin 
        checkStatus(WorkflowStatus.Registering) 
    {
        require(bytes(_name).length > 0, "Ten ung vien khong duoc de trong!");

        Candidate[] storage list = pollCandidates[activePollId];
        uint256 id = list.length + 1;
        list.push(Candidate({
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
        require(!pollVoters[activePollId][_voter].isRegistered, "Cu tri nay da duoc dang ky truoc do!");

        pollVoters[activePollId][_voter].isRegistered = true;

        emit VoterRegistered(_voter);
    }

    // Mở hòm phiếu để bắt đầu bình chọn
    function startVoting() 
        external 
        onlyAdmin 
        checkStatus(WorkflowStatus.Registering) 
    {
        require(pollCandidates[activePollId].length >= 2, "Can it nhat 2 ung vien de bat dau cuoc bau cu!");
        polls[activePollId].status = WorkflowStatus.Voting;
        emit StatusChanged(WorkflowStatus.Registering, WorkflowStatus.Voting);
    }

    // Đóng hòm phiếu và kết thúc cuộc bầu cử
    function endVoting() 
        external 
        onlyAdmin 
        checkStatus(WorkflowStatus.Voting) 
    {
        polls[activePollId].status = WorkflowStatus.Ended;
        emit StatusChanged(WorkflowStatus.Voting, WorkflowStatus.Ended);
    }

    // Cử tri thực hiện bỏ phiếu cho một ứng viên (Chuẩn Checks-Effects-Interactions)
    function vote(uint256 _candidateId) 
        external 
        checkStatus(WorkflowStatus.Voting) 
    {
        Voter storage sender = pollVoters[activePollId][msg.sender];
        Candidate[] storage list = pollCandidates[activePollId];

        // 1. Checks: Kiểm tra điều kiện hợp lệ
        require(sender.isRegistered, "Ban khong co ten trong danh sach duoc phep bo phieu!");
        require(!sender.hasVoted, "Ban da bo phieu roi, khong the bo phieu lai!");
        require(_candidateId > 0 && _candidateId <= list.length, "Ma so ung vien khong hop le!");

        // 2. Effects: Cập nhật trạng thái cử tri và số phiếu
        sender.hasVoted = true;
        sender.votedCandidateId = _candidateId;
        list[_candidateId - 1].voteCount += 1;
        polls[activePollId].totalVotes += 1;

        // 3. Interactions: Phát sự kiện ra Blockchain
        emit VoteCasted(msg.sender, _candidateId);
    }

    // Lấy toàn bộ danh sách ứng cử viên để hiển thị lên giao diện (miễn phí Gas)
    function getCandidates() external view returns (Candidate[] memory) {
        return pollCandidates[activePollId];
    }

    // Lấy tổng số lượng ứng cử viên
    function getCandidatesCount() external view returns (uint256) {
        return pollCandidates[activePollId].length;
    }

    // Xác định ứng cử viên có số phiếu cao nhất khi cuộc bầu cử kết thúc (Thuật toán 2 bước xử lý hòa phiếu)
    function getWinner() 
        external 
        view 
        checkStatus(WorkflowStatus.Ended) 
        returns (string memory winnerName, uint256 highestVote) 
    {
        // Trường hợp 0: Chưa có bất kỳ phiếu bầu nào được ghi nhận
        if (polls[activePollId].totalVotes == 0) {
            return ("Khong co phieu bau", 0);
        }

        Candidate[] storage list = pollCandidates[activePollId];

        // Bước 1: Quét tìm số phiếu cao nhất trong danh sách ứng cử viên
        uint256 maxVotes = 0;
        uint256 winningIndex = 0;

        for (uint256 i = 0; i < list.length; i++) {
            if (list[i].voteCount > maxVotes) {
                maxVotes = list[i].voteCount;
                winningIndex = i;
            }
        }

        // Bước 2: Đếm số lượng ứng cử viên cùng đạt số phiếu cao nhất
        uint256 tieCount = 0;
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i].voteCount == maxVotes) {
                tieCount++;
            }
        }

        // Nếu có từ 2 ứng viên trở lên cùng đạt số phiếu cao nhất -> Bất phân thắng bại (Hòa)
        if (tieCount > 1) {
            return ("Ket qua hoa (Tie)", maxVotes);
        }

        // Nếu chỉ có duy nhất 1 ứng viên đạt số phiếu cao nhất -> Người đắc cử
        return (list[winningIndex].name, maxVotes);
    }
}
