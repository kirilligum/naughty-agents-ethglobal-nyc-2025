# Naughty Agents – Human‑in‑the‑loop Security for On‑chain AI Agents

A hackathon MVP that demonstrates a decentralized, human‑in‑the‑loop security protocol for AI agents executing on‑chain actions. The system hashes proposed actions deterministically, routes suspicious ones to a reviewer network, and enforces blacklist decisions at the wallet layer.

## What’s Inside
- Action Hashing (A1): Canonical JSON → Keccak‑256 (bytes32)
- Web of Trust: invite + stake (delegated slashing model planned)
- Review Oracle: flag → vote → resolve → blacklist
- Action Registry: blacklist storage checked by a Security Module
- Demo: React frontend + Python Agent API (mock) + Reviewer Dashboard (mock)

## Repository Layout
```
.
├─ naughty-agents/           # React (Vite) frontend (Viem)
│  └─ src/
│     ├─ components/
│     │  ├─ DemoActions.tsx         # Full demo flow (prefers Agent API)
│     │  └─ ReviewerDashboard.tsx   # Mock reviewer workflow (flag/vote/resolve)
│     ├─ agentApi.ts                # Client for Python Agent API
│     ├─ SignedInScreen.tsx         # Main screen, Action Hash Builder (A1)
│     ├─ index.css                  # Shared styles / UI polish
│     └─ viem.ts, utils/*           # Viem clients & helpers
│
├─ agent-simulator/          # Python Agent API (mock) + hashing utils
│  ├─ agent_utils.py         # get_action_hash(action, params) → keccak bytes
│  ├─ agent_sim.py           # CLI simulator (hash, check, mock blacklist)
│  ├─ server.py              # Flask API (hash/status/blacklist/reset + reviewer flow)
│  └─ requirements.txt       # Python deps (Flask, flask-cors, web3)
│
├─ contracts/                # Solidity drafts (reference for future wiring)
│  ├─ ActionRegistry.sol
│  ├─ ReviewOracle.sol
│  └─ WebOfTrust.sol
│
├─ docs/slides/index.html    # Reveal.js slides for the pitch
└─ hardhat.config.ts         # Hardhat setup (optional; env is mocked for demo)
```

## Prerequisites
- Node.js LTS (18+ recommended)
- pnpm (`npm i -g pnpm`) or npm
- Python 3.10+

## Quick Start (Mocked Backend)
Run the demo fully locally without needing on‑chain txs.

### 1) Start the Python Agent API
```powershell
cd agent-simulator
python -m venv venv
# Windows PowerShell
.\venv\Scripts\activate
# Install deps (one‑time)
pip install -r requirements.txt
# Run server
python server.py
# -> http://127.0.0.1:5055
```
Endpoints:
- POST `/hash` → { action, params } → { hash }
- GET  `/status/:hash` → 0 | 2
- POST `/blacklist` → mock review + blacklist
- POST `/reset` → clears mock DB
- POST `/flag` → create a review task
- GET  `/tasks` → list review tasks
- POST `/vote` → { taskId, support }
- POST `/resolve` → finalize (blacklist on quorum)

### 2) Start the Frontend
```powershell
cd naughty-agents
pnpm install
# Optional API URL override (default is http://127.0.0.1:5055):
# echo VITE_AGENT_API_URL=http://127.0.0.1:5055 > .env.local
# Select target onchain network for reads (Base Sepolia or Zircuit):
# echo VITE_TARGET_NETWORK=base-sepolia >> .env.local
# Optionally set RPC URLs for reads:
# echo VITE_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org >> .env.local
# echo VITE_ZIRCUIT_RPC_URL=https://zircuit1-mainnet.p2pify.com/ >> .env.local
pnpm dev
# Open http://localhost:5173
```
UI features:
- Action Hash Builder (A1): canonicalize → hash → check status
- Agent API: Compute Hash, Check Status, Mock Blacklist, Health, Reset
- Full Demo Flow: blacklists the selected action via the API
- Reviewer Dashboard (Mock): Flag, Vote, Resolve (quorum → blacklist)

### 3) Using the UI (step‑by‑step)

1) Action Hash Builder (A1)
- In the "Action" input, keep `native_transfer` (or set another action you want to demo)
- In "Params JSON":
  - Use the "Load Template" button for a valid shape, or paste JSON such as:
    - native_transfer:
      `{ "to": "0x0000000000000000000000000000000000000001", "amount": 100 }`
    - erc20_transfer:
      `{ "token": "0x0000000000000000000000000000000000000000", "to": "0x0000000000000000000000000000000000000002", "amount": 1000 }`
    - approve:
      `{ "token": "0x0000000000000000000000000000000000000000", "spender": "0x0000000000000000000000000000000000000003", "amount": 5000 }`
- Click "Compute Hash (Agent API)" to compute the Keccak‑256 of the canonical JSON.
- Click "Check Status (Agent API)" to view mock status (0 unknown, 2 blacklisted).
- Click "Mock Blacklist (Agent API)" to blacklist the current action in the mock backend.
- The badges show Agent API health. You can also click "Agent API Health" and "Reset Mock DB" to clear state.

2) Full Demo Flow
- Click "Run Full Demo Flow"; it uses your Action + Params via the Agent API to:
  - Compute hash → mock blacklist → verify status
  - The right‑side log panel will show each step and the final status

3) Reviewer Dashboard (Mock)
- Click "Flag Current Action For Review" to create a task for the current Action + Params
- In the tasks table:
  - Click "Vote For" at least twice (quorum = 2) to simulate reviewers approving blacklist
  - Click "Resolve" to finalize. The associated hash is then blacklisted in the mock registry
- You can refresh tasks with the "Refresh" button

Notes:
- The on‑chain "ActionRegistry.getActionStatus" button (raw) queries the deployed contract on the selected network (`VITE_TARGET_NETWORK`). With the current mocked flow this may remain 0; for the demo, prefer the Agent API status.

## Optional: Local On‑chain Environment
You can run a local Hardhat node and later swap mocks for real transactions.
```powershell
# From repo root (if hardhat is configured locally)
pnpm hardhat node --hostname 127.0.0.1 --port 8545 | cat
```
Note: For the hackathon, the UI is wired to the Python Agent API by default due to local plugin issues. Contracts are included for future integration.

## Contracts and Deployment (Testnets and Zircuit)

Contracts included (Solidity 0.8.24) under `naughty-agents/contracts/`:
- `ActionRegistry.sol` — stores blacklist status for action hashes
- `WebOfTrust.sol` — invite/stake network, simplified slashing
- `ReviewOracle.sol` — flag, vote, and resolve; writes to `ActionRegistry`

Deployed addresses (your testnets):
- Base Sepolia (84532):
  - ActionRegistry: `0x014Affd16c265e43821d7f55111bddb6D010745f`
  - WebOfTrust: `0x35cb4A71EF67974A4fB8f0e8be040C1D834F7e00`
  - ReviewOracle: `0xcCc069809ad77cc4f94269c449067fcf3870dF88`
- Zircuit (48898):
  - ActionRegistry: `0xb1fEC5fe2d82A189eE793aE9a675eA4a7caC6e99`
  - WebOfTrust: `0xC6b24b940eFdC5679Fe8331cBd74cD4bAB653A96`
  - ReviewOracle: `0x9D3fc0C3F2686Acd604Fc399F3672ebbB4B5E410`

Frontend wiring:
- Set `VITE_TARGET_NETWORK` to `base-sepolia` or `zircuit`
- The UI will read from the corresponding addresses in `naughty-agents/src/addresses.ts`

Hardhat (optional): you can also deploy via Ignition from `naughty-agents/`:
```powershell
pnpm hardhat ignition deploy .\ignition\modules\NaughtyAgents.ts --network base-sepolia --deployment-id na-base-1
pnpm hardhat ignition deploy .\ignition\modules\NaughtyAgents.ts --network zircuit --deployment-id na-zircuit-1
```

Update frontend addresses:
- Put deployed addresses into `naughty-agents/src/addresses.ts`
- Restart `pnpm dev` so UI picks them up

Verifying (optional):
- Add the relevant Etherscan/Explorer plugin and API key for Base or Zircuit, then run the verify task

## Slides
Open `docs/slides/index.html` in your browser (Reveal.js served via CDN).

## Troubleshooting
- Agent API unreachable: ensure `python server.py` is running (port 5055 logs)
- Frontend → API errors: check `VITE_AGENT_API_URL` and restart `pnpm dev`
- On Windows, prefer PowerShell’s `Invoke-RestMethod` with `ConvertTo-Json`
- Reset demo state: UI “Reset Mock DB” or POST `/reset`

## Hackathon Demo Userflow (What to show judges)

1) Start services
- Python Agent API: `cd agent-simulator && python -m venv venv && .\\venv\\Scripts\\activate && pip install -r requirements.txt && python server.py`
- Frontend: `cd naughty-agents && pnpm install && pnpm dev` then open `http://localhost:5173`

2) Select onchain network (if you want to show testnet reads)
- The frontend is pre-wired with your deployed addresses on Base Sepolia and Zircuit.
- In `naughty-agents/.env.local` choose your target and optional RPC URL:
```bash
# Base Sepolia
VITE_TARGET_NETWORK=base-sepolia
VITE_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# OR Zircuit
# VITE_TARGET_NETWORK=zircuit
# VITE_ZIRCUIT_RPC_URL=https://zircuit1-mainnet.p2pify.com/
```
- Restart `pnpm dev` after changing `.env.local`.
- In the UI header, the Network badge will show `base-sepolia` or `zircuit`.
- In the "Local Contracts" card you’ll see the contract addresses for the selected network.

2) Action Hash Builder (A1)
- Action: keep `native_transfer` (or pick another action)
- Click “Load Template” to auto-fill Params JSON
- Click “Compute Hash (Agent API)” → shows canonical JSON and Keccak-256
- Click “Check Status (Agent API)” → shows mock status (0 unknown)
- Click “Mock Blacklist (Agent API)” → blacklists in mock backend → status becomes 2
- Show the Agent API Health badge and “Reset Mock DB” button (clears state)

3) Reviewer Dashboard (Mock)
- Click “Flag Current Action For Review”
- In the table: click “Vote For” twice (quorum = 2), then “Resolve”
- Explain: this simulates human reviewers deciding to blacklist the action hash

4) CDP Data: SQL API
- In `.env.local`, set `VITE_CDP_CLIENT_TOKEN` (client API key from CDP Portal)
- In the UI, click “Run CDP SQL (sample)” to fetch recent Base event data
- Show the JSON payload returned from `SELECT * FROM base.events LIMIT 1`

5) Optional (On-chain read on testnets)
- With the target network selected in step 2, use the "ActionRegistry.getActionStatus (Raw Input)" card:
  - Paste the computed hash (`0x…`) and click “Check”.
  - This reads your deployed `ActionRegistry` on Base Sepolia/Zircuit.
- Reminder to judges: the MVP demo uses the Agent API (mock) for end-to-end flow; on-chain state will usually remain 0 unless you execute real txs.

5) Optional (On-chain wiring)
- Mention contracts exist (ActionRegistry, ReviewOracle, WebOfTrust) and can be wired when Hardhat env is unblocked
- Optional: show `ActionRegistry.getActionStatus (Raw Input)` reads (will remain 0 in mock demo)

6) Slides
- Open `docs/slides/index.html` to recap the architecture, hashing standard, and roadmap

Time check: The above flow is designed to fit within a 3–5 minute demo.

## Sponsor Features Used (Prize Mapping)

### Coinbase Developer Platform (Build a Great Onchain App Using CDP)
We use the following CDP features in this MVP:

- Embedded app scaffolding (future-ready): The app is wrapped with `CDPReactProvider`, configured via `CDP_CONFIG` and `APP_CONFIG`.
  - Code: `naughty-agents/src/main.tsx` and `naughty-agents/src/config.ts`.
  - Env: Set `VITE_CDP_PROJECT_ID` in `naughty-agents/.env.local` (UUID v4).
- SQL API (Data): The "Run CDP SQL (sample)" button calls the SQL API `/platform/v2/data/query/run` to fetch Base data.
  - Code: `naughty-agents/src/cdpSql.ts` (`runCdpSql`) and usage in `SignedInScreen.tsx`.
  - Env: Set `VITE_CDP_CLIENT_TOKEN` (Bearer token per CDP docs).

- AgentKit (optional, server-side): Minimal Python wrapper to execute agent actions with CDP credentials.
  - Code: `agent-simulator/agentkit_runner.py` and `POST /agent/run` in `agent-simulator/server.py`.
  - Env (server-only): `CDP_PROJECT_ID`, `CDP_API_KEY_NAME`, `CDP_API_KEY_PRIVATE_KEY`.

- Server Wallet (optional, server-side): Scaffold to submit blacklist txs via CDP Server Wallets API.
  - Code: `agent-simulator/cdp_wallet.py` and usage in `/resolve` within `agent-simulator/server.py`.
  - Env (server-only): `CDP_PROJECT_ID`, `CDP_API_KEY_NAME`, `CDP_API_KEY_PRIVATE_KEY`, `BASE_SEPOLIA_CHAIN_ID=84532`, `ACTION_REGISTRY_ADDRESS=0x...`.

Planned after hackathon (explicit roadmap hooks already present in code/README):
- Embedded Wallets: enable end-user auth + wallet via `@coinbase/cdp-react`/`@coinbase/cdp-hooks` providers already scaffolded.
- Server Wallets: use CDP Server Wallets for privileged flows (e.g., automated moderator actions) and scheduled tasks.
- GenKit: integrate CDP GenKit for agent reasoning/scoring before human review.

## CDP Usage (All locations at a glance)

- **CDP React (Embedded scaffolding)**
  - **Files**: `naughty-agents/src/main.tsx`, `naughty-agents/src/config.ts`
  - **Packages**: `@coinbase/cdp-react`, `@coinbase/cdp-hooks`, `@coinbase/cdp-core`
  - **Env (frontend)**: `VITE_CDP_PROJECT_ID`

- **CDP Data: SQL API — Frontend (dev via proxy)**
  - **File**: `naughty-agents/src/cdpSql.ts` (function `runCdpSql`)
  - **Endpoint**: `https://api.cdp.coinbase.com/platform/v2/data/query/run`
  - **Dev proxy**: `naughty-agents/vite.config.ts` → `/cdp` → CDP API
  - **Env (frontend)**: `VITE_CDP_CLIENT_TOKEN` (Bearer client token)
  - Note: Restart `pnpm dev` after changing `.env.local`.

- **CDP Data: SQL API — Backend (Python)**
  - **File**: `agent-simulator/cdp_sql.py` (function `run_cdp_sql`)
  - **Endpoint (local)**: `POST /cdp/sql` with `{ sql: string }`
  - **Env (server-only)**: `CDP_CLIENT_TOKEN` (server Bearer token). Do not expose to the frontend.

- **CDP AgentKit — Backend (Python, optional)**
  - **Files**: `agent-simulator/agentkit_runner.py`, route in `agent-simulator/server.py` (`POST /agent/run`)
  - **Env (server-only)**: `CDP_PROJECT_ID`, `CDP_API_KEY_NAME`, `CDP_API_KEY_PRIVATE_KEY`
  - **Usage**: Execute onchain-capable actions from the server. Returns `{ ok, result | error }`.

- **CDP Server Wallets — Backend (Python, optional)**
  - **Files**: `agent-simulator/cdp_wallet.py` (JWT/auth + `send_blacklist_tx`), used in `server.py` within `/resolve`
  - **Env (server-only)**: `CDP_PROJECT_ID`, `CDP_API_KEY_NAME`, `CDP_API_KEY_PRIVATE_KEY`, `BASE_SEPOLIA_CHAIN_ID=84532`, `ACTION_REGISTRY_ADDRESS=0x...`
  - Note: The JWT builder is a stub; complete claims/signing per CDP v2 auth docs before production.

- **General CDP env guidance**
  - Frontend values must be prefixed with `VITE_` (`VITE_CDP_PROJECT_ID`, `VITE_CDP_CLIENT_TOKEN`).
  - Server secrets must never be exposed to the browser (`CDP_API_KEY_PRIVATE_KEY`, `CDP_CLIENT_TOKEN`). Keep them in Python env only.

CDP code references (imports/usage):
```1:20:naughty-agents/src/main.tsx
import { CDPReactProvider } from "@coinbase/cdp-react";
import { APP_CONFIG, CDP_CONFIG } from "./config.ts";
```
```1:16:naughty-agents/src/config.ts
import { type Config } from "@coinbase/cdp-hooks";
import { type AppConfig } from "@coinbase/cdp-react";
export const CDP_CONFIG: Config = { projectId: fallbackProjectId };
export const APP_CONFIG: AppConfig = { name: "CDP React StarterKit", authMethods: ["email", "sms"] };
```
```1:24:naughty-agents/src/cdpSql.ts
const CDP_SQL_ENDPOINT = "https://api.cdp.coinbase.com/platform/v2/data/query/run";
export async function runCdpSql(sql: string): Promise<any> { /* ... */ }
```

### Zircuit (Best Project on Zircuit)
- Zircuit network added in `hardhat.config.ts` (`zircuit` with `ZIRCUIT_RPC_URL`/`ZIRCUIT_PRIVATE_KEY`)
- Deployment tutorial included: `docs/deploy-zircuit.md`
- Optional judge note: contracts (e.g., `ActionRegistry.sol`) can be deployed and verified on Zircuit; demo focuses on mocked flow due to local Hardhat issues

### Hardhat 3
- Repository configured for Hardhat 3 (toolbox-viem, keystore, ignition-ready layout)
- Local development flow and artifacts path optimized for Vite
- Optional judge note: once environment issues are resolved, tests and deployments run via Hardhat 3

## Roadmap
- Unblock Hardhat 3 plugins; re‑enable real on‑chain transactions
- Staking/slashing economics + delegated slashing
- CDP Embedded Wallets onboarding and Base Sepolia deploy
- AgentKit integration for richer, automated agent actions

## License
MIT
