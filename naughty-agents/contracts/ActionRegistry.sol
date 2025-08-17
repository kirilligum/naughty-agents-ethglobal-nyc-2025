// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ActionRegistry {
    // 0: Unknown, 2: Blacklisted
    mapping(bytes32 => uint8) public actionStatus;
    address public reviewOracleAddress;

    // Called during deployment/setup (e.g., by Ignition)
    function setReviewOracleAddress(address _oracleAddress) external {
        require(reviewOracleAddress == address(0), "Oracle already set");
        reviewOracleAddress = _oracleAddress;
    }

    modifier onlyReviewOracle() {
        require(msg.sender == reviewOracleAddress, "Not authorized");
        _;
    }

    function getActionStatus(bytes32 _actionHash) external view returns (uint8) {
        return actionStatus[_actionHash];
    }

    function addToBlacklist(bytes32 _actionHash) external onlyReviewOracle {
        actionStatus[_actionHash] = 2;
    }
}
