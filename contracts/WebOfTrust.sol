// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title WebOfTrust
/// @notice Minimal staking + invite code contract used by the demo deploy script.
contract WebOfTrust {
    struct Member {
        uint256 stakedAmount;
        address inviter;
        bool isActive;
    }

    mapping(address => Member) public members;
    mapping(bytes32 => address) public inviterOfCode;

    uint256 public requiredStake;
    address public immutable GENESIS_MEMBER;

    event MemberRegistered(address indexed member, address invitedBy);
    event InviteCodeCreated(bytes32 indexed inviteCode, address indexed creator);

    modifier onlyActiveMember() {
        require(members[msg.sender].isActive, "not active");
        _;
    }

    constructor(uint256 _requiredStake) {
        requiredStake = _requiredStake;
        GENESIS_MEMBER = msg.sender;
        members[msg.sender] = Member({
            stakedAmount: _requiredStake,
            inviter: address(0),
            isActive: true
        });
    }

    function createInviteCode() external onlyActiveMember returns (bytes32) {
        bytes32 code = keccak256(abi.encodePacked(msg.sender, block.timestamp));
        inviterOfCode[code] = msg.sender;
        emit InviteCodeCreated(code, msg.sender);
        return code;
    }

    function register(bytes32 inviteCode) external payable {
        require(inviterOfCode[inviteCode] != address(0), "bad code");
        require(!members[msg.sender].isActive, "already active");
        require(msg.value >= requiredStake, "stake too low");

        members[msg.sender] = Member({
            stakedAmount: msg.value,
            inviter: inviterOfCode[inviteCode],
            isActive: true
        });

        emit MemberRegistered(msg.sender, inviterOfCode[inviteCode]);
    }
}


