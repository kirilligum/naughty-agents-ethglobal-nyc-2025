// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IActionRegistry {
    function getActionStatus(bytes32 _actionHash) external view returns (uint8);
}

