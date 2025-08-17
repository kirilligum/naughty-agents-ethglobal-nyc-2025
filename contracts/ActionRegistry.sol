// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ActionRegistry
/// @notice Minimal blacklist registry used by the demo deploy script.
contract ActionRegistry {
    // 0 = Unknown, 1 = UnderReview, 2 = Blacklisted
    mapping(bytes32 => uint8) public actionStatus;

    address public reviewOracleAddress;
    address public owner;

    event ReviewOracleAddressSet(address indexed reviewOracle);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyReviewOracle() {
        require(msg.sender == reviewOracleAddress, "only oracle");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setReviewOracleAddress(address _reviewOracle) external onlyOwner {
        reviewOracleAddress = _reviewOracle;
        emit ReviewOracleAddressSet(_reviewOracle);
    }

    function getActionStatus(bytes32 actionHash) external view returns (uint8) {
        return actionStatus[actionHash];
    }

    function addToBlacklist(bytes32 actionHash) external onlyReviewOracle {
        actionStatus[actionHash] = 2;
    }
}


