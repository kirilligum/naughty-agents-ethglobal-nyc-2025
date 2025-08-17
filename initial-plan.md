### 🛡️ Revised Project Plan: Naughty Agents (Hackathon MVP)

**(Section 1: Project Description remains the same as the original plan.)**

#### 2. System Architecture (Revised)

The protocol architecture is revised to ensure security enforcement occurs at the wallet layer, not the agent layer.

**a. Frontend (React App on Vite)**
*   **Purpose:** User and reviewer interface.
*   **Key Modules:** User Dashboard, Reviewer Dashboard (Web of Trust members).
*   **Onboarding:** Integrates with CDP Embedded Wallets for email-based sign-up. Crucially, this process will deploy a Smart Contract Account (SCA) for the user and configure the Naughty Agents security module.

**b. AI Agent (Python + Coinbase AgentKit)**
*   **Purpose:** Simulates the user's AI agent.
*   **Role:** The agent acts as an **Operator** or authorized signer for the user's SCA. It proposes transactions but cannot execute them unilaterally.
*   **Core Logic:** The agent logic focuses purely on its task (e.g., browsing social media) and generating transaction intents. **No security logic is placed here**, as we assume the agent can be compromised.

**c. On-Chain Enforcement Layer (Solidity on Hardhat + SCA)**
*   **Purpose:** The decentralized source of truth and the mandatory enforcement layer.
*   **CRITICAL CHANGE: Smart Contract Account (SCA) & Security Module**
    *   `UserSCA`: The actual wallet holding the user's funds.
    *   `NaughtyAgentsSecurityModule`: A module (or "hook") attached to the `UserSCA`. This module intercepts *every* transaction initiated by the Operator (the AI Agent).
    *   **Enforcement Logic:** Before executing any transaction, the module checks the `ActionRegistry`. If the action hash is blacklisted or unknown, the transaction reverts on-chain.

**d. On-Chain Protocol Logic (Solidity on Hardhat)**
*   **Purpose:** Manages the registry and the review process.
*   **Core Contracts:**
    *   `WebOfTrust`: Manages reviewer identity, stake, and the simplified slashing mechanism.
    *   `ActionRegistry`: Stores the blacklist of action hashes. (Whitelisting omitted for MVP).
    *   `ReviewOracle`: Manages the queue of actions pending human review and executes the blacklist consensus.
    *   `Treasury`: Handles user subscription payments and distributes rewards.

#### 3. Smart Contract Interfaces (Simplified for MVP)

**a. `ActionRegistry`**

```solidity
// State Variables
// 0: Unknown (Default), 2: Blacklisted. (Status 1: Whitelisted is omitted for MVP)
mapping(bytes32 => uint8) public actionStatus;
address public reviewOracleAddress; // Only the oracle can update the blacklist

// Functions
function getActionStatus(bytes32 _actionHash) external view returns (uint8 status);
function addToBlacklist(bytes32 _actionHash) external; // Only callable by ReviewOracle
```

**b. `WebOfTrust` (Simplified Slashing)**

```solidity
// State Variables
mapping(address => bytes32) public inviteCodes;
mapping(bytes32 => address) public inviterOfCode;
uint256 public requiredStake;
mapping(address => Member) public members;

// Functions
function createInviteCode() external returns (bytes32);
function register(bytes32 _inviteCode) external payable;
// Simplified Slashing for MVP: Triggers immediate penalty upon user report.
// See Appendix C for limitations and future improvements.
function reportBadReview(address _reviewer) external;
```

**c. `ReviewOracle`**

```solidity
// Structs
struct ReviewTask {
    bytes32 actionHash;
    bool isResolved;
    // ... other metadata
}

// Functions
// Called by SecurityModule if status is Unknown
function flagActionForReview(bytes32 _actionHash) external;
// Only WebOfTrust members
function castBlacklistVote(uint256 _taskId, bool _approveBlacklist) external;
function resolveBlacklistVote(uint256 _taskId) external;
```

**d. `NaughtyAgentsSecurityModule` (New - Enforcement Hook)**

```solidity
// State Variables
address public actionRegistry;
address public reviewOracle;

// Function called by the UserSCA during transaction validation phase
function validateTransaction(address dest, uint256 value, bytes calldata data) external returns (bool) {
    // 1. Calculate the hash using the standard defined in Appendix A1
    bytes32 actionHash = calculateActionHash(dest, value, data);

    // 2. THE SECURITY CHECK
    uint8 status = IActionRegistry(actionRegistry).getActionStatus(actionHash);

    if (status == 2) { // Blacklisted
        revert("NaughtyAgents: Action Blacklisted");
    }

    if (status == 0) { // Unknown
        // Flag for review and halt execution (stall the transaction).
        IReviewOracle(reviewOracle).flagActionForReview(actionHash);
        revert("NaughtyAgents: Unknown Action - Pending Review");
    }

    // If status is safe (not implemented in MVP), return success.
    return true;
}
```

#### 4. Detailed Demo Flow (Revised)

**Scene 1: The Setup (User & Reviewer Onboarding)**
🗣️ **Presenter Script:** "Welcome to Naughty Agents. Alice signs up via CDP Embedded Wallets and subscribes. Crucially, she now deploys her Smart Contract Account (SCA) and installs the Naughty Agents Security Module onto it. On the other side, Bob uses an invite code to join the Web of Trust and stake his ETH."
💻 **Frontend Action:**
*   Alice's View: Show Alice signing up, subscribing, and clicking "Deploy Secure Wallet."
*   Bob's View: Bob pastes the invite code, clicks "Stake & Register," and confirms.
⚙️ **Backend & On-Chain Action:**
*   Alice deploys `UserSCA` configured with `NaughtyAgentsSecurityModule`.
*   Bob calls `WebOfTrust.register()`.

**Scene 2: The Attack (Hijacking and On-Chain Reversion)**
🗣️ **Presenter Script:** "Alice's agent browses a social media feed and encounters a Malicious Image Patch (MIP). The agent is hijacked and attempts to drain Alice's wallet. The agent signs the malicious transaction, but the security is enforced on-chain by the SCA itself. The Security Module intercepts the transaction, sees it's an unknown command, and automatically reverts it while flagging it for human review."
💻 **Frontend Action:**
*   Show the simulated social feed and the MIP.
*   Run the Python agent script. The agent attempts the transaction.
*   Alice's "Agent Transaction Log" shows: `native_transfer(0xHacker...)` with a status `REVERTED: Pending Human Review`.
⚙️ **Backend & On-Chain Action:**
*   The hijacked agent signs the malicious transaction and submits it.
*   The `UserSCA` calls `validateTransaction` on the `NaughtyAgentsSecurityModule`.
*   The module checks `ActionRegistry`. It returns `Unknown (0)`.
*   The module calls `flagActionForReview` on the `ReviewOracle` and reverts the transaction. The funds never leave the SCA.

**Scene 3: The Community Defense (Flagging & Blacklisting)**
*(Remains the same as the original plan: Alice can emphasize the flag, Bob sees the task and votes to blacklist it. The status updates to `BLACKLISTED`.)*

**Scene 4: The Economic Incentive (Simplified Slashing)**
🗣️ **Presenter Script:** "This system is backed by economic incentives. Let's say a reviewer, Charlie, incorrectly voted against blacklisting that malicious transfer. For this MVP, Alice can immediately report his bad review, triggering an instant slash on Charlie and a delegated slash on the person who invited him. While we recognize this needs a robust arbitration system in the future (as detailed in our roadmap), this demonstrates the core concept of the Web of Trust and shared financial responsibility."
💻 **Frontend Action:**
*   Alice clicks `Report Bad Review` on Charlie's vote and confirms the transaction.
*   Admin View: Show Charlie's and his inviter's staked balances decreasing.
⚙️ **Backend & On-Chain Action:**
*   Alice's frontend calls `reportBadReview` on the `WebOfTrust` contract.
*   The contract executes the primary and delegated slashes immediately.

**(Appendices A (Implementation Details) and B (Pitch Deck) remain relevant, noting that A1 hashing is now used by the SecurityModule.sol).**

#### Appendix C: Future Enhancements and Limitations

This MVP focuses on demonstrating the core concept of decentralized, human-in-the-loop security enforced via Smart Contract Accounts. The following critical features were deferred for the hackathon.

**C1. Robust Arbitration and Dispute Resolution (High Priority)**
*   **Limitation:** The MVP uses immediate, user-driven slashing (`reportBadReview`). This is highly vulnerable to griefing attacks (users slashing honest reviewers) and will deter participation in a live environment.
*   **Future Solution:** Implement a formal dispute resolution system. Users must post a bond to appeal a decision. Appeals are escalated to a "Jury" (a larger pool of reviewers or a DAO vote). Slashing only occurs if the Jury overturns the original decision, ensuring decentralized consensus on the ground truth.

**C2. Decentralized Whitelisting (High Priority)**
*   **Limitation:** The MVP only supports blacklisting. This means every new, safe action will be flagged as "Unknown" and blocked pending review, creating a poor user experience and high load on reviewers. Centralized whitelisting is unscalable.
*   **Future Solution:** Allow the `WebOfTrust` reviewers to vote on whitelisting safe actions. This enables the protocol to instantly approve known-safe interactions and adapt to new dApps.

**C3. Latency Management and Risk Policies (Medium Priority)**
*   **Limitation:** Blocking all unknown transactions pending human review introduces significant latency, which may be unacceptable for time-sensitive operations (e.g., trading).
*   **Future Solution:** Allow users to configure risk policies (e.g., "Allow unknowns if value < $X") and introduce automated risk scoring to bypass human review for low-risk actions.

**C4. Scalability and Scoped Hashing (Low Priority)**
*   **Limitation:** Hashing the exact transaction payload is brittle; every unique parameter set creates a new hash.
*   **Future Solution:** Implement "Scoped Hashing," allowing the protocol to whitelist function signatures with parameter constraints (e.g., "Whitelist `swap` on Uniswap if `slippage` < 1%").
