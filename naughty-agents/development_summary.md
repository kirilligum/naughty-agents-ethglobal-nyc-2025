# Development Summary

This document provides a step-by-step summary of the development process for the Naughty Agents project.

## Phase 1: Smart Contract Implementation & Testing

This was the foundational phase, focused on building and testing the on-chain logic.

1.  **Project Setup:**
    - The project was initialized with a Hardhat 3 + Viem + Node.js test runner template.
    - The `hardhat.config.ts` was configured to use Solidity `0.8.24` and to output artifacts to the `src/` directory for frontend access.
    - Required dependencies (`@openzeppelin/contracts`, `forge-std`) were installed.
    - Boilerplate `Counter` contract and test files were removed to clean up the project and resolve compiler version conflicts.

2.  **Contract Implementation:**
    - **`WebOfTrust.sol`:** Implemented the core logic for member registration via invite codes, staking, and a simplified slashing mechanism (`PRIMARY_SLASH_PERCENT` and `DELEGATED_SLASH_PERCENT`).
    - **`ActionRegistry.sol`:** Created a simple registry to store the status of action hashes, with access restricted to the Review Oracle.
    - **`ReviewOracle.sol`:** Implemented the logic for flagging actions, casting votes, and resolving votes to blacklist an action once a quorum is met.

3.  **Testing & Debugging:**
    - **Initial Test:** A TypeScript test file, `test/WebOfTrust.ts`, was created. The initial plan's Solidity-based test (`.t.sol`) was incompatible with the Hardhat test runner and was deleted.
    - **Test Debugging:** A significant portion of time was spent debugging the test environment.
        - **`loadFixture` Issue:** The initial import path for `loadFixture` was incorrect for the project's module structure. After trying to fix the path and installing `hardhat-network-helpers` and `chai` directly, the issue persisted. The solution was to abandon `loadFixture` and adopt the test structure from the original template's `Counter.ts` test file.
        - **`hre.viem` Undefined:** The Hardhat Runtime Environment (`hre`) was not being injected as expected. The solution, found by referencing the restored `Counter.ts`, was to import `describe` and `it` from `node:test` and get the `viem` instance from `await network.connect()` instead of a global `hre` object.
    - **Integration Test:** A second test file, `test/Protocol.ts`, was created to test the full end-to-end flow from flagging an action in the `ReviewOracle` to it being blacklisted in the `ActionRegistry`.
    - **Final Result:** All 6 unit and integration tests passed successfully, ensuring the on-chain logic is sound.

## Phase 2: Frontend dApp Implementation

This phase focused on building a basic UI to interact with the smart contracts.

1.  **Component Scaffolding:**
    - A `UserDashboard.tsx` component was created with placeholder buttons for user actions.
    - A `ReviewerDashboard.tsx` component was created with an input for an invite code and a "Stake & Register" button.
    - A view toggle was added to `SignedInScreen.tsx` to switch between the two dashboards.

2.  **Smart Contract Integration:**
    - An Ignition script, `ignition/modules/NaughtyAgents.ts`, was created to handle the deployment and linking of the three core contracts.
    - The contracts were deployed to a local Hardhat network to get their addresses.
    - The `ReviewerDashboard.tsx` was refactored to connect to the `WebOfTrust` contract.
        - It uses `viem`'s `createPublicClient` to read the `requiredStake` from the contract.
        - It uses the `<SendTransactionButton />` component from the CDP toolkit to handle the `register` transaction, passing the invite code and the required stake as the transaction value.
        - The `data` payload for the transaction is created using `encodeFunctionData` from `viem`.

3.  **Build & Debugging:**
    - The frontend build initially failed due to several TypeScript errors.
    - **JSON Imports:** The `tsconfig.app.json` was updated with `"resolveJsonModule": true` to allow importing the contract ABI.
    - **Import Paths:** The import path for the JSON ABI was corrected from `../artifacts` to `./artifacts`.
    - **Type Errors:** A type mismatch from `readContract` was fixed by casting the result to a `bigint`.
    - After these fixes, the project build (`pnpm build`) completed successfully.

## Phase 3: AI Agent Simulator

This phase involved creating a Python script to simulate the agent's behavior.

1.  **Directory Setup:** The `agent-simulator/` directory was created with a Python virtual environment.
2.  **Script Implementation:**
    - An `agent.py` script was created.
    - The `get_action_hash` function was implemented as specified in the project's "Atomic Action Hashing Standard."
    - Two simulation functions were added: `simulate_benign_action` and `simulate_hijacked_action`.
    - A command-line runner was added to the script to allow executing either simulation mode (`python agent.py [benign|hijacked]`).
3.  **Verification:** Both modes of the script were executed successfully, demonstrating the correct generation of action hashes for different scenarios.

## Phase 4: Pitch Deck

The final phase was the creation of the web-based presentation.

1.  **Setup:** A `pitch-deck/` directory was created with an `index.html` file.
2.  **reveal.js Integration:** The `index.html` was set up with boilerplate to use `reveal.js` from a CDN.
3.  **Content Population:** The 12 slides outlined in the project's Appendix B were created as `<section>`s in the HTML.
4.  **Mermaid.js Integration:** The Mermaid.js library was added via a CDN script tag. The `<div>` elements for the diagrams were changed to `<pre>`, and the necessary initialization script was added to render the diagrams.
