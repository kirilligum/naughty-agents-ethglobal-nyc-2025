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

## 3. User Flow (Demo Scenario)

1.  **Onboarding:**
    - **Alice (User):** Opens the dApp, signs in with her email, and in the **User View** can interact with buttons like "Subscribe" and "Deploy Secure Wallet".
    - **Bob (Reviewer):** Toggles to the **Reviewer View**, enters a valid invite code into the input field, and clicks the "Stake & Register" button to send an on-chain transaction to join the network.

2.  **The Attack:**
    - Alice's AI agent, while browsing a simulated social media feed, is "hijacked" by a malicious image.
    - The agent attempts to drain Alice's wallet by proposing a malicious transaction.
    - The transaction is intercepted by the on-chain `NaughtyAgentsSecurityModule`. It checks the transaction's hash against the `ActionRegistry`, finds its status is "Unknown," and reverts the transaction. Simultaneously, it flags the action for human review via the `ReviewOracle`.

3.  **Community Defense:**
    - In the **Reviewer View**, Bob clicks "Refresh" to fetch the latest flagged actions from the backend API. New tasks appear in his dashboard.
    - He analyzes the action and (in a future implementation) would click buttons to vote on it.
    - Once enough reviewers vote (meeting the quorum), the `ReviewOracle` calls the `ActionRegistry` to permanently blacklist the action's hash.

4.  **Economic Incentives:**
    - If a reviewer like Bob makes a bad call, Alice can report him. This triggers the `reportBadReview` function in the `WebOfTrust` contract, which slashes a portion of Bob's stake and also a smaller portion of the stake of the person who invited him.
