// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {WebOfTrust} from "./WebOfTrust.sol";
import {ActionRegistry} from "./ActionRegistry.sol";

contract ReviewOracle {
    struct ReviewTask {
        bytes32 actionHash;
        uint256 votesForBlacklist;
        bool isResolved;
    }

    WebOfTrust public webOfTrust;
    ActionRegistry public actionRegistry;
    ReviewTask[] public tasks;
    uint256 constant QUORUM = 3;

    // mapping(taskId => mapping(address => hasVoted))
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ActionFlagged(uint256 indexed taskId, bytes32 actionHash);
    event VoteCast(uint256 indexed taskId, address indexed voter, bool approve);
    event VoteResolved(uint256 indexed taskId, bytes32 actionHash, bool blacklisted);

    constructor(address _webOfTrust, address _actionRegistry) {
        webOfTrust = WebOfTrust(_webOfTrust);
        actionRegistry = ActionRegistry(_actionRegistry);
    }

    // Called by the Security Module
    function flagActionForReview(bytes32 _actionHash) external {
        // In a real implementation, you might check if there's already an open task for this hash
        uint256 taskId = tasks.length;
        tasks.push(ReviewTask({
            actionHash: _actionHash,
            votesForBlacklist: 0,
            isResolved: false
        }));
        emit ActionFlagged(taskId, _actionHash);
    }

    modifier onlyActiveMember() {
        require(webOfTrust.isMemberActive(msg.sender), "Not an active member");
        _;
    }

    function castBlacklistVote(uint256 _taskId, bool _approveBlacklist) external onlyActiveMember {
        require(_taskId < tasks.length, "Invalid task ID");
        ReviewTask storage task = tasks[_taskId];
        require(!task.isResolved, "Task already resolved");
        require(!hasVoted[_taskId][msg.sender], "Already voted");

        hasVoted[_taskId][msg.sender] = true;
        if (_approveBlacklist) {
            task.votesForBlacklist++;
        }

        emit VoteCast(_taskId, msg.sender, _approveBlacklist);
    }

    function resolveBlacklistVote(uint256 _taskId) external {
        require(_taskId < tasks.length, "Invalid task ID");
        ReviewTask storage task = tasks[_taskId];
        require(!task.isResolved, "Task already resolved");

        if (task.votesForBlacklist >= QUORUM) {
            actionRegistry.addToBlacklist(task.actionHash);
            task.isResolved = true;
            emit VoteResolved(_taskId, task.actionHash, true);
        }
        // In a full implementation, you might handle the "no" vote case,
        // e.g., if a certain number of "no" votes are cast, or after a timeout.
        // For the MVP, we only resolve on blacklisting.
    }
}
