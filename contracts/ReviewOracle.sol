// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IActionRegistryMinimal {
    function addToBlacklist(bytes32 actionHash) external;
}

interface IWebOfTrustMinimal {
    function members(address) external view returns (uint256, address, bool);
}

/// @title ReviewOracle
/// @notice Minimal review oracle coordinating blacklist decisions.
contract ReviewOracle {
    struct ReviewTask {
        bytes32 actionHash;
        uint256 votesFor;
        bool resolved;
    }

    IWebOfTrustMinimal public webOfTrust;
    IActionRegistryMinimal public actionRegistry;

    ReviewTask[] public tasks;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public constant QUORUM = 2;

    event ActionFlagged(uint256 indexed taskId, bytes32 indexed actionHash, address indexed flagger);
    event Voted(uint256 indexed taskId, address indexed voter);
    event Resolved(uint256 indexed taskId, bytes32 indexed actionHash);

    constructor(address _webOfTrust, address _actionRegistry) {
        webOfTrust = IWebOfTrustMinimal(_webOfTrust);
        actionRegistry = IActionRegistryMinimal(_actionRegistry);
    }

    modifier onlyActiveMember() {
        (, , bool isActive) = webOfTrust.members(msg.sender);
        require(isActive, "not active member");
        _;
    }

    function flagActionForReview(bytes32 actionHash) external onlyActiveMember returns (uint256 taskId) {
        tasks.push(ReviewTask({ actionHash: actionHash, votesFor: 0, resolved: false }));
        taskId = tasks.length - 1;
        emit ActionFlagged(taskId, actionHash, msg.sender);
    }

    function castBlacklistVote(uint256 taskId) external onlyActiveMember {
        require(taskId < tasks.length, "bad task");
        ReviewTask storage t = tasks[taskId];
        require(!t.resolved, "resolved");
        require(!hasVoted[taskId][msg.sender], "already");
        hasVoted[taskId][msg.sender] = true;
        t.votesFor += 1;
        emit Voted(taskId, msg.sender);
    }

    function resolveBlacklistVote(uint256 taskId) external onlyActiveMember {
        require(taskId < tasks.length, "bad task");
        ReviewTask storage t = tasks[taskId];
        require(!t.resolved, "resolved");
        require(t.votesFor >= QUORUM, "no quorum");
        t.resolved = true;
        actionRegistry.addToBlacklist(t.actionHash);
        emit Resolved(taskId, t.actionHash);
    }
}


