// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IActionRegistry} from "./interfaces/IActionRegistry.sol";
import {IReviewOracle} from "./interfaces/IReviewOracle.sol";

contract NaughtyAgentsSecurityModule {
    address public immutable actionRegistry;
    address public immutable reviewOracle;

    constructor(address _actionRegistry, address _reviewOracle) {
        require(_actionRegistry != address(0) && _reviewOracle != address(0), "Zero address");
        actionRegistry = _actionRegistry;
        reviewOracle = _reviewOracle;
    }

    function calculateActionHash(address dest, uint256 value, bytes calldata data) public pure returns (bytes32) {
        // MVP placeholder: hash raw tx tuple; frontend/agent should use A1 standard
        return keccak256(abi.encode(dest, value, data));
    }

    // Called by the UserSCA during transaction validation phase
    function validateTransaction(address dest, uint256 value, bytes calldata data) external returns (bool) {
        bytes32 actionHash = calculateActionHash(dest, value, data);
        uint8 status = IActionRegistry(actionRegistry).getActionStatus(actionHash);

        if (status == 2) {
            revert("NaughtyAgents: Action Blacklisted");
        }
        if (status == 0) {
            IReviewOracle(reviewOracle).flagActionForReview(actionHash);
            revert("NaughtyAgents: Unknown Action - Pending Review");
        }
        return true;
    }
}

