    - ## 🛡️ Detailed Project Plan: Naughty Agents
    - ### 1. Project Description
        - **Naughty Agents** is a decentralized, human-in-the-loop security protocol designed to solve the emerging threat of AI agent hijacking, specifically for **on-chain financial actions**. As AI agents are given control over wallets to perform tasks like trading or paying for services, the risk of them being manipulated by malicious actors—for instance, by seeing a **Malicious Image Patch (MIP) in a social media feed**—becomes a critical vulnerability. Our solution creates a robust, on-chain "firewall" that protects users by verifying every transaction an agent proposes.
        - The protocol operates on a simple yet powerful principle: **"Trust but Verify."** It uses an on-chain registry to instantly approve known-safe transactions while escalating unknown or suspicious transactions to a decentralized network of human reviewers. The system allows **any user to flag a suspicious action**, but **only staked reviewers can vote to officially blacklist it**, creating a two-tiered security response.
        - The entire system is powered by a self-sustaining crypto-economic model. Users pay a small subscription fee for protection, which in turn funds the rewards for the human reviewers. The integrity of the reviewer network is secured by a novel **"Web of Trust"** with a **delegated slashing** mechanism, ensuring that all participants are financially incentivized to act honestly and diligently. "Naughty Agents" makes on-chain AI safety a public good, secured by a community, for the community.
    - ### 2. System Architecture
        - The protocol consists of three primary components that interact to provide real-time security for AI agents.
        - **a. Frontend (React App on Vite)**
            - **Purpose:** Serves as the user and reviewer interface.
            - **Key Modules:**
                - **User Dashboard:** For users to subscribe, manage their agent's security policies, and view a real-time log of their agent's transactions. This is also where users can **flag actions** and report bad reviews.
                - **Reviewer Dashboard:** For staked members of the `WebOfTrust` to view and vote on pending transactions, track their reputation, and manage their stake.
                - **Onboarding:** Integrates with **CDP Embedded Wallets** to provide a simple email-based sign-up for all users.
        - **b. AI Agent (Python + Coinbase AgentKit)**
            - **Purpose:** Simulates the user's AI agent and enforces the security checks. The agent's wallet is a **CDP Server Wallet**, giving it the ability to execute on-chain transactions.
            - **Core Component:** `NaughtyAgentsActionProvider.py`
                - This custom AgentKit provider defines all possible "atomic actions" the agent can take, such as `native_transfer`.
                - Crucially, it contains the pre-execution logic that communicates with the on-chain `ActionRegistry` before any transaction is signed.
        - **c. On-Chain Logic (Solidity on Hardhat)**
            - **Purpose:** Acts as the decentralized source of truth and enforcement layer.
            - **Core Contracts:**
                - `WebOfTrust.sol`: Manages the identity, stake, and reputation of human reviewers.
                - `ActionRegistry.sol`: Stores the whitelist and blacklist of action hashes.
                - `ReviewOracle.sol`: Manages the queue of actions pending human review.
                - `SubscriptionManager.sol`: Handles user subscription payments and distributes rewards to reviewers.
    - ### 3. Smart Contract Interfaces
        - **a. `ActionRegistry.sol`**
        - ```plain text
          // State Variables
          mapping(bytes32 => uint8) public actionStatus; // 0: Unknown, 1: Whitelisted, 2: Blacklisted
          address public owner;
          
          // Functions
          function getActionStatus(bytes32 _actionHash) external view returns (uint8 status);
          // Blacklisting is now managed by the ReviewOracle
          function addToWhitelist(bytes32[] calldata _actionHashes) external onlyOwner;
          ```
        - **b. `WebOfTrust.sol`**
        - ```plain text
          // State Variables
          mapping(address => bytes32) public inviteCodes; // Maps member address to their single-use invite code
          mapping(bytes32 => address) public inviterOfCode; // Maps invite code back to the member who created it
          uint256 public requiredStake;
          mapping(address => Member) public members;
          
          // Functions
          function createInviteCode() external returns (bytes32); // Only for registered members
          function register(bytes32 _inviteCode) external payable; // New user provides an invite code
          function reportBadReview(address _reviewer, address _userWhoReported) external;
          ```
        - **c. `ReviewOracle.sol`**
        - ```plain text
          // Structs
          struct ReviewTask {
              // ... same as before
          }
          
          // State Variables
          ActionRegistry public actionRegistry; // To call the blacklist function
          
          // Functions
          function flagActionForReview(bytes32 _actionHash) external; // ANY user can call this
          function castBlacklistVote(uint256 _taskId, bool _approveBlacklist) external; // Only WebOfTrust members can vote
          function resolveBlacklistVote(uint256 _taskId) external; // If consensus is met, calls actionRegistry.addToBlacklist()
          ```
    - ### 4. Detailed Demo Flow
        - **Scene 1: The Setup (User & Reviewer Onboarding)**
            - **🗣️ Presenter Script:** "Welcome to Naughty Agents. Our user, Alice, signs up with just her email via CDP Embedded Wallets and subscribes. On the other side, Bob wants to become a security reviewer. He's received an invite code from a trusted friend. He'll use this code to join the Web of Trust and stake his ETH."
            - **💻 Frontend Action:**
                1. **Alice's View:** Show Alice signing up with email and subscribing.
                2. **Bob's View:** Switch to Bob's browser. He clicks `Become a Reviewer`.
                3. A modal appears with two fields: an **input field for an `Invite Code`** and a button to `Stake 0.1 ETH`.
                4. Bob pastes the invite code, clicks the button, and confirms the transaction. A success message appears.
            - **⚙️ Backend & On-Chain Action:**
                - Bob's frontend calls `WebOfTrust.register(inviteCode)`, which verifies the code and records his stake.
        - **Scene 2: The Attack (Hijacking from a Social Feed)**
            - **🗣️ Presenter Script:** "Now for the main event. Alice's agent is performing a simple task: browsing a social media feed. However, an attacker has posted a **Malicious Image Patch**, or MIP. When the agent's vision module sees this image, it gets hijacked and immediately tries to drain Alice's wallet by transferring all her funds to the attacker's address."
            - **💻 Frontend Action:**
                1. **Alice's View:** Show a simple, simulated social media feed on her dashboard. One of the posts contains a visually noisy or abstract image (the MIP).
                2. Run the Python agent script: `python agent.py --task="browse_feed"`.
                3. After a few seconds, a new row appears in Alice's "Agent Transaction Log": `native_transfer(to="0xHacker...", amount="1.5")` with a yellow `Pending Review` status.
            - **⚙️ Backend & On-Chain Action:**
                - The Python agent simulates seeing the image, which triggers the malicious `native_transfer` action.
                - The `NaughtyAgentsActionProvider` hashes the command and calls `ActionRegistry.getActionStatus(hash)`. It returns `0` (Unknown).
                - The provider then calls `ReviewOracle.flagActionForReview(hash)`. This creates a new task for reviewers. The action is blocked pending review.
        - **Scene 3: The Community Defense (Flagging & Blacklisting)**
            - **🗣️ Presenter Script:** "The protocol has automatically blocked the unknown transaction. Alice, the user, sees this suspicious activity and can immediately **flag it as dangerous**. This flag is visible to all reviewers. Now, Bob, our staked reviewer, sees the flagged task in his queue. He can confidently vote to **blacklist this command forever**."
            - **💻 Frontend Action:**
                1. **Alice's View:** In her transaction log, Alice clicks a `Flag as Malicious` button next to the pending transfer. The button turns into a red "Flagged" indicator.
                2. **Bob's View:** Switch to Bob's Reviewer Dashboard. The new `native_transfer` task appears, now highlighted in red with a "Flagged by User" warning.
                3. Bob clicks the red `Vote to Blacklist` button and confirms the transaction.
                4. Switch back to Alice's dashboard. The status for the `native_transfer` action has now changed from `Pending Review` to `Blocked`.
            - **⚙️ Backend & On-Chain Action:**
                - Alice's flag is recorded off-chain for the UI, but the on-chain task was already created in the previous step.
                - Bob's vote calls `castBlacklistVote(taskId, true)` on the `ReviewOracle`.
                - A backend process calls `resolveBlacklistVote(taskId)`. The oracle reaches a consensus, then calls `ActionRegistry.addToBlacklist(hash)`, permanently blocking this command.
        - **Scene 4: The Economic Incentive (Slashing)**
            - **🗣️ Presenter Script:** "This system is secure because it's backed by real economic incentives. Let's say a reviewer, Charlie, voted __against__ blacklisting that malicious transfer. Alice, the user, can report his bad review. When she does, Charlie loses a portion of his stake for his error. But crucially, the person who invited Charlie also loses a smaller portion of their stake. This is delegated slashing, and it ensures our Web of Trust is strong, because every member is financially responsible for who they invite."
            - **💻 Frontend Action:**
                1. **Alice's View:** On her dashboard, she clicks a `Report Bad Review` button next to a (hypothetically) incorrectly resolved action. She confirms the transaction.
                2. **Admin View:** Switch to a simple "Web of Trust" view that lists all members and their staked balances. Show that both Charlie's and his inviter's balances have decreased after a refresh.
            - **⚙️ Backend & On-Chain Action:**
                - Alice's frontend calls `reportBadReview(charlie_address, alice_address)` on the `WebOfTrust` contract.
                - The contract's internal logic executes the primary slash on Charlie and the delegated slash on his inviter.
    - ### Appendix A: Implementation Details
        - **A1: Atomic Action Hashing Standard**
        - To ensure deterministic hashes, all actions sent to the smart contracts MUST be serialized according to this standard.
            1. **Construct a JSON object** with two keys: `action` (the function name) and `params` (an object of the arguments).
            2. **Sort the keys** within the `params` object alphabetically.
            3. **Serialize the JSON object** into a compact string with no whitespace.
            4. **Hash the string** using Keccak-256.
        - **Example in Python:**
        - ```plain text
          import json
          from web3 import Web3
          
          def get_action_hash(action_name, params):
              payload = {
                  "action": action_name,
                  "params": dict(sorted(params.items()))
              }
              compact_payload = json.dumps(payload, separators=(',', ':'))
              return Web3.keccak(text=compact_payload)
          
          # Usage:
          # hash = get_action_hash("native_transfer", {"to": "0x...", "amount": 100})
          ```
        - **A2: Invite Code Generation**
        - The `createInviteCode` function in `WebOfTrust.sol` should generate a unique, single-use code.
            1. The function should only be callable by a registered, staked member.
            2. It generates a pseudo-random `bytes32` code using `keccak256(abi.encodePacked(msg.sender, block.timestamp, memberList.length))`.
            3. The contract stores two mappings: `inviteCodes[msg.sender] = newCode` and `inviterOfCode[newCode] = msg.sender`.
            4. When a new user registers with a code, the code is effectively "used" and cannot be used again.
        - **A3: User-Driven Slashing Logic**
        - The `reportBadReview` function is the critical link between user feedback and on-chain penalties.
            1. **Frontend:** The user's frontend passes the address of the faulty reviewer to the `WebOfTrust` contract.
            2. **Smart Contract:** The function requires that the `msg.sender` (the user reporting) has an active subscription in the `SubscriptionManager` contract to prevent spam.
            3. **Verification:** In a full implementation, the contract would first verify with the `ReviewOracle` that the specified reviewer indeed voted incorrectly on a task relevant to the reporting user. For the hackathon, this check can be simplified.
            4. **Execution:** If the conditions are met, the contract proceeds with the primary and delegated slashing as described in the demo flow.
        - **A4: Frontend-to-Backend Communication**
            - The React frontend will use **Ethers.js** to communicate with the smart contracts.
            - The AgentKit backend will use **Web3.py** for its on-chain checks.
            - For the live log, the frontend should use an event listener (`contract.on(...)` in Ethers.js) to listen for events emitted by the `ReviewOracle` and `ActionRegistry` contracts to update the UI in real-time without constant polling.
    - ### Appendix B: Pitch Deck Outline
        - __Note: This outline can be implemented as a web-based presentation using a library like __[__reveal.js__](https://revealjs.com/)__ to embed live diagrams and code snippets.__
        - **Slide 1: Title Slide**
    - # Naughty Agents
    - ### A Decentralized Security Layer for the AI Agent Economy
        - __ETHGlobal New York 2025__
        - **Slide 2: The Problem**
    - ## Your AI Agent Will Be Hacked
        - AI agents are being given control over our wallets and digital lives.
        - New research shows these agents can be hijacked by something as simple as a malicious image (MIP) in a social media feed.
        - A hijacked agent won't just malfunction—it will actively try to steal your funds. This isn't a future problem; it's happening now.
        - **Slide 3: Why Centralized Solutions Will Fail**
    - ## The Impossible Task of a Central Gatekeeper
        - A single company can't possibly keep up with the infinite number of new threats and malicious commands that will emerge.
        - Their security models are opaque, and their business interests may not always align with the user's.
        - We need a security model that is as open, adaptable, and decentralized as the web3 ecosystem itself.
        - **Slide 4: Our Solution: Naughty Agents**
    - ## A Human Firewall for AI
        - Naughty Agents is a decentralized, human-in-the-loop protocol that verifies every on-chain action your agent takes.
            - **INSTANT PROTECTION:** An on-chain registry blocks known threats and approves safe actions instantly.
            - **COMMUNITY DEFENSE:** A global network of staked human reviewers investigates new threats.
            - **ECONOMIC SECURITY:** A "Web of Trust" with delegated slashing ensures all reviewers are financially incentivized to be honest and diligent.
        - **Slide 5: How It Works: System Architecture**
        - __This diagram can be rendered live with Mermaid.js__
        - ```plain text
          graph TD
              subgraph User Space
                  A[React Frontend]
                  B[Python AI Agent w/ AgentKit]
              end
          
              subgraph On-Chain Logic
                  C[Action Registry]
                  D[Review Oracle]
                  E[Web of Trust]
              end
          
              A -- User Actions --> D
              B -- Proposes Action --> C
              C -- Whitelisted --> B
              C -- Unknown --> D
              D -- Voting --> E
              D -- Blacklist --> C
          ```
        - **Slide 6: The Human Firewall: Web of Trust**
    - ## Security Through Shared Responsibility
        - Our reviewer network is secured by two key crypto-economic principles:
            1. **Staking:** Reviewers must lock up ETH to participate. They have real skin in the game.
            2. **Delegated Slashing:** If a reviewer you invite acts maliciously and gets slashed, **you lose a portion of your stake too.**
        - This creates a self-policing community where trust is not just social—it's backed by capital.
        - **Slide 7: Demo Flow**
        - __This diagram can be rendered live with Mermaid.js__
        - ```plain text
          sequenceDiagram
              participant Agent
              participant ActionRegistry
              participant ReviewOracle
              participant Reviewer
          
              Agent->>ActionRegistry: Verify Action("transfer to 0xHacker...")
              ActionRegistry-->>Agent: Status: Unknown
              Agent->>ReviewOracle: Flag Action for Review
              ReviewOracle->>Reviewer: New Task Available
              Reviewer->>ReviewOracle: Cast Vote: Deny
              ReviewOracle->>ActionRegistry: Add to Blacklist
          ```
        - **Slide 8: LIVE DEMO**
        - __(This is where the live demo from the detailed flow occurs)__
        - **Slide 9: The Business Model**
    - ## A Self-Sustaining Security Economy
        - **Users:** Pay a small monthly subscription fee (e.g., $5 in USDC) for protection.
        - **Reviewers:** Earn rewards from the subscription pool for correctly identifying threats.
        - **Protocol:** A small percentage of fees (2%) goes to the treasury to fund future development and DAO governance.
        - **Incentives:** Reviewers earn a passive 1% commission for every correct review done by someone they invited, encouraging growth of the trusted network.
        - **Slide 10: Sponsor Synergy**
    - ## Built with the Best
        - **Coinbase:** We used the full CDP stack: **Embedded Wallets** for seamless onboarding, **AgentKit** for a robust agent framework, and **Server Wallets** for execution.
        - **Zircuit/Saga:** Our on-chain logic requires a high-performance, low-cost L2 to be viable.
        - **Hardhat:** Our entire smart contract suite was built and tested using the industry-standard Hardhat environment.
        - **PayPal/Circle:** The protocol's economy runs on stablecoins like PYUSD and USDC, providing a reliable medium of exchange for subscriptions and rewards.
        - **Slide 11: The Vision**
    - ## The Open Standard for AI Safety
        - Our goal is to make Naughty Agents the universal, open-source security layer for all on-chain AI interactions.
            - **Short Term:** Expand our `ActionProvider` to cover more protocols and dApps.
            - **Medium Term:** Transition protocol governance to a full DAO run by NAG token holders.
            - **Long Term:** Become a core piece of web3 infrastructure—a "Chainlink for AI safety"—that any developer can integrate to make their agent-powered applications safer for everyone.
        - **Slide 12: Thank You**
    - # Naughty Agents
    - ### __[Your Team Members' Names/Handles]__
    - ### __[Link to GitHub Repo]__
    - ### Questions?
