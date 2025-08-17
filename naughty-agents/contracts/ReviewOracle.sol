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

    constructor(address _webOfTrust, address _actionRegistry) {
        webOfTrust = WebOfTrust(_webOfTrust);
        actionRegistry = ActionRegistry(_actionRegistry);
    }

    // Called by the Security Module
    function flagActionForReview(bytes32 _actionHash) external {
        require(actionRegistry.getActionStatus(_actionHash) == 0, "Action already known");
        tasks.push(ReviewTask({
            actionHash: _actionHash,
            votesForBlacklist: 0,
            isResolved: false
        }));
        emit ActionFlagged(tasks.length - 1, _actionHash);
    }

    // Only WebOfTrust members
    function castBlacklistVote(uint256 _taskId, bool _approveBlacklist) external {
        (, , bool isActive) = webOfTrust.members(msg.sender);
        require(isActive, "Not an active WebOfTrust member");
        require(!hasVoted[_taskId][msg.sender], "Already voted");
        require(!tasks[_taskId].isResolved, "Task already resolved");

        if (_approveBlacklist) {
            tasks[_taskId].votesForBlacklist++;
        }
        hasVoted[_taskId][msg.sender] = true;
    }

    function resolveBlacklistVote(uint256 _taskId) external {
        require(!tasks[_taskId].isResolved, "Task already resolved");
        require(tasks[_taskId].votesForBlacklist >= QUORUM, "Quorum not reached");

        tasks[_taskId].isResolved = true;
        actionRegistry.addToBlacklist(tasks[_taskId].actionHash);
    }
}
