// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IReviewOracle {
    function flagActionForReview(bytes32 _actionHash) external;
}

