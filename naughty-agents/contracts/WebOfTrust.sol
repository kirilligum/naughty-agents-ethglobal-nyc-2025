// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract WebOfTrust {
    struct Member {
        uint256 stakedAmount;
        address invitedBy;
        bool isActive;
    }

    mapping(address => Member) public members;
    mapping(bytes32 => address) public inviterOfCode;
    uint256 public requiredStake;
    address public immutable GENESIS_MEMBER;

    event MemberRegistered(address indexed member, address invitedBy);
    event InviteCodeCreated(bytes32 code, address indexed creator);

    constructor(uint256 _requiredStake) {
        requiredStake = _requiredStake;
        GENESIS_MEMBER = msg.sender;
        // Bootstrap the network
        members[msg.sender] = Member({stakedAmount: 0, invitedBy: address(0), isActive: true});
    }

    modifier onlyActiveMember() {
        require(members[msg.sender].isActive, "Not an active member");
        _;
    }

    function createInviteCode() external onlyActiveMember returns (bytes32) {
        // Simple pseudo-random code generation for MVP
        bytes32 code = keccak256(abi.encodePacked(msg.sender, block.timestamp));
        inviterOfCode[code] = msg.sender;
        emit InviteCodeCreated(code, msg.sender);
        return code;
    }

    function isMemberActive(address _member) external view returns (bool) {
        return members[_member].isActive;
    }

    function register(bytes32 _inviteCode) external payable {
        require(msg.value >= requiredStake, "Insufficient stake");
        require(!members[msg.sender].isActive, "Already registered");

        address inviter = inviterOfCode[_inviteCode];
        require(inviter != address(0), "Invalid or used code");

        // Burn the code
        delete inviterOfCode[_inviteCode];

        members[msg.sender] = Member({
            stakedAmount: msg.value,
            invitedBy: inviter,
            isActive: true
        });
        emit MemberRegistered(msg.sender, inviter);
    }

    uint256 public constant PRIMARY_SLASH_PERCENT = 10;
    uint256 public constant DELEGATED_SLASH_PERCENT = 5;

    // Simplified for MVP: Assumes the report is valid.
    function reportBadReview(address _reviewer) external {
        Member storage reviewer = members[_reviewer];
        require(reviewer.isActive, "Reviewer not active");

        // 1. Primary Slash (Multiply before dividing for precision)
        uint256 primarySlash = (reviewer.stakedAmount * PRIMARY_SLASH_PERCENT) / 100;
        reviewer.stakedAmount -= primarySlash;

        // 2. Delegated Slash
        address inviterAddr = reviewer.invitedBy;
        if (inviterAddr != address(0) && inviterAddr != GENESIS_MEMBER) {
            Member storage inviter = members[inviterAddr];
            uint256 delegatedSlash = (inviter.stakedAmount * DELEGATED_SLASH_PERCENT) / 100;
            inviter.stakedAmount -= delegatedSlash;
        }
    }
}
