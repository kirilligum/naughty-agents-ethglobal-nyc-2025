# Naughty Agents: A Decentralized AI Agent Firewall

## 1. Project Overview

Naughty Agents is a decentralized, human-in-the-loop security protocol designed to solve the emerging threat of AI agent hijacking for on-chain financial actions. As AI agents are given control over wallets, the risk of them being manipulated by malicious actors—for instance, by seeing a Malicious Image Patch (MIP) in a social media feed—becomes a critical vulnerability. Our solution creates a robust, on-chain "firewall" that protects users by verifying every transaction an agent proposes.

The protocol operates on the principle of "Trust but Verify." It uses an on-chain registry to instantly approve known-safe transactions while escalating unknown or suspicious transactions to a decentralized network of human reviewers. The system is powered by a self-sustaining crypto-economic model where user subscription fees fund rewards for the human reviewers, whose integrity is secured by a "Web of Trust" with delegated slashing.

### System Architecture

- **Frontend (React on Vite):** User and reviewer interface. Integrates with CDP Embedded Wallets and deploys a Smart Contract Account (SCA) for the user.
- **AI Agent (Python):** A simulator that acts as an operator for the user's SCA, proposing transactions without having execution rights.
- **On-Chain Logic (Solidity on Hardhat):**
    - **Smart Contract Account (SCA):** The user's wallet, which includes the `NaughtyAgentsSecurityModule`. This module intercepts every transaction, checks it against the `ActionRegistry`, and reverts it if it's blacklisted or unknown.
    - **Core Contracts:** `WebOfTrust` (manages reviewers), `ActionRegistry` (stores blacklisted actions), `ReviewOracle` (manages the review queue), and `Treasury`.

## 2. How to Run

### Prerequisites
- Node.js and pnpm
- Python 3

### a. Smart Contracts

The core logic of the protocol resides in the Solidity smart contracts.

1.  **Navigate to the project directory:**
    ```bash
    cd naughty-agents
    ```
2.  **Install dependencies:**
    ```bash
    pnpm install
    ```
3.  **Compile the contracts:**
    ```bash
    pnpm hardhat compile
    ```
4.  **Run the tests:**
    ```bash
    pnpm hardhat test
    ```
5.  **Deploy the Contracts:**
    Before running the frontend, you should deploy the contracts to a network.

    **a. Deploy to a Local Network**
    In one terminal, start a local Hardhat node:
    ```bash
    pnpm hardhat node
    ```
    In another terminal, deploy the contracts using the Ignition script:
    ```bash
    pnpm hardhat ignition deploy ignition/modules/NaughtyAgents.ts --network localhost
    ```

    **b. Deploy to a Testnet (Base Sepolia or Zircuit)**
    1.  First, set up your environment variables. Copy the example file:
        ```bash
        cp .env.example .env
        ```
    2.  Edit the `.env` file and add your private key and a testnet RPC URL. For example, for Base Sepolia:
        ```
        BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
        DEPLOYER_PRIVATE_KEY="YOUR_PRIVATE_KEY_HERE"
        ```
    3.  Run the deployment command, specifying the network:
        ```bash
        # Deploy to Base Sepolia
        pnpm hardhat ignition deploy ignition/modules/NaughtyAgents.ts --network base-sepolia

        # Deploy to Zircuit Testnet
        pnpm hardhat ignition deploy ignition/modules/NaughtyAgents.ts --network zircuit
        ```

### b. Frontend dApp

The user and reviewer dashboards are built with React and Vite.

1.  **Navigate to the project directory:**
    ```bash
    cd naughty-agents
    ```
2.  **Run the development server:**
    ```bash
    pnpm dev
    ```
    This will start the frontend on a local server (usually `http://localhost:5173`).

### c. AI Agent Simulator

The Python script simulates the agent proposing transactions.

1.  **Navigate to the agent directory:**
    ```bash
    cd naughty-agents/agent-simulator
    ```
2.  **Create a virtual environment and install dependencies:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # or . venv/bin/activate
    pip install web3 python-dotenv
    ```
3.  **Run the simulation:**
    You can run the simulation in two modes:
    ```bash
    # To simulate a normal, safe transaction
    python agent.py benign

    # To simulate a hijacked agent proposing a malicious transaction
    python agent.py hijacked
    ```

### d. API Server (for Reviewer Dashboard)

The backend server uses the Coinbase SQL API to fetch review tasks.

1.  **Navigate to the API server directory:**
    ```bash
    cd naughty-agents/api-server
    ```
2.  **Create a virtual environment and install dependencies:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```
3.  **Set up your environment variables:**
    Create a `.env` file by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Now, edit the `.env` file and add your `CDP_API_KEY`.
4.  **Run the server:**
    ```bash
    python server.py
    ```
    The server will start on `http://127.0.0.1:5055`.

### e. Pitch Deck

The presentation is a simple HTML file.

1.  **Open the file:**
    Navigate to the `naughty-agents/pitch-deck/` directory and open the `index.html` file in your web browser.

## 3. User Flow (Hackathon Demo Script)

This flow demonstrates the core functionality of the Naughty Agents protocol and its use of the sponsor technologies.

**Tools Used in this Demo:**
- **Coinbase Developer Platform:** CDP Embedded Wallets, CDP SQL API
- **Zircuit:** Smart Contracts deployed on Zircuit Testnet
- **Hardhat 3:** Used for all contract development, testing, and deployment.

---

### Scene 1: Simple Onboarding

1.  **Presenter:** "First, we'll onboard two users. Alice, a typical user, and Bob, who will become a security reviewer."
2.  **Action:** Show the dApp UI.
3.  **Presenter:** "Alice signs up seamlessly using just her email, powered by **CDP Embedded Wallets**. In the background, a new Smart Contract Account is created for her on the **Zircuit Testnet**."
4.  **Action:** Show the "User View" of the dashboard.
5.  **Presenter:** "Now, let's switch to Bob. He wants to become a reviewer. He navigates to the 'Reviewer View', enters an invite code, and clicks 'Stake & Register'. This sends a transaction to our `WebOfTrust` contract on **Zircuit**."

### Scene 2: The Attack & On-Chain Defense

1.  **Presenter:** "Next, we'll run our **Python AI Agent** simulator. The agent is browsing a social media feed when it encounters a malicious image designed to hijack it."
2.  **Action:** Run the agent script in "hijacked" mode: `python agent.py hijacked`.
3.  **Presenter:** "The hijacked agent now attempts to drain Alice's wallet. But because her wallet is secured by our on-chain module, the transaction is intercepted. The module checks our `ActionRegistry` contract on **Zircuit**, sees the action is unknown, and instantly reverts the transaction while flagging it for review."

### Scene 3: Community Defense via SQL API

1.  **Presenter:** "The malicious action has been stopped, but now it needs to be permanently blacklisted. This is where our human reviewers and the **Coinbase SQL API** come in."
2.  **Action:** Switch to the "Reviewer View" in the dApp and click "Refresh".
3.  **Presenter:** "When Bob clicks refresh, our backend makes a call to the **CDP SQL API**. We run a query to `SELECT` all `ActionFlagged` events from our `ReviewOracle` contract on **Zircuit**. The new task instantly appears in his dashboard."
4.  **Action:** Show the task list in the UI.
5.  **Presenter:** "Bob sees the malicious request, and votes to blacklist it. Once enough reviewers agree, the action is permanently blacklisted in our `ActionRegistry` on-chain."

## 4. Hackathon Prize Submissions

### a. Coinbase: "Build a Great Onchain App Using CDP"

- **Project:** Naughty Agents - A decentralized, human-in-the-loop security protocol for AI agents.
- **CDP Tools Used:**
    - `[x]` **CDP Embedded Wallets:** Used for seamless, email-based user onboarding, which is critical for abstracting away crypto complexity and making the dApp accessible.
    - `[x]` **CDP Data APIs (SQL API):** Used as the core data layer for our Reviewer Dashboard. The backend server uses the SQL API to efficiently query for `ActionFlagged` events on the Zircuit testnet, providing reviewers with a real-time list of security threats to vote on.
- **Developer Feedback:**
    > *(Please add your personal feedback here about your experience using the Coinbase Developer Platform tools.)*

### b. Zircuit: "Best Project on Zircuit"

- **One-Sentence Description:** Naughty Agents is an on-chain firewall, powered by a human-in-the-loop review process, that protects Smart Contract Accounts from malicious transactions proposed by hijacked AI agents.
- **Zircuit Integration:** The core of our protocol's security logic—the `WebOfTrust`, `ActionRegistry`, and `ReviewOracle` smart contracts—is deployed and verified on the Zircuit Testnet. We chose Zircuit for its focus on security and performance, which are essential for a protocol that acts as a real-time security layer for user transactions. Zircuit's architecture provides a reliable and low-cost environment for the frequent, small interactions our protocol requires (e.g., flagging, voting).
- **Team Description:**
    > *(Please add a short description of your team and their backgrounds here.)*
- **Testing Instructions:** Please refer to the "How to Run" section above for detailed instructions on compiling, testing, and deploying the contracts, as well as running the frontend and simulators.
- **Feedback on Zircuit:**
    > *(Please add your personal feedback here about your experience building on Zircuit.)*

### c. Hardhat: Development Environment

- **Tool:** The entire smart contract lifecycle was built, tested, and deployed using the **Hardhat 3** development environment.
- **How We Used Hardhat:** We leveraged modern Hardhat 3 features to build a robust project:
    - **Viem & Node.js Test Runner:** All contract tests were written in TypeScript using the new, efficient test runner.
    - **Ignition:** Deployments to all networks (localhost, Base Sepolia, Zircuit) are managed through a single, reliable Ignition script (`ignition/modules/NaughtyAgents.ts`).
    - **Configuration:** Hardhat's flexible configuration made it simple to add support for multiple networks like Base and Zircuit.
