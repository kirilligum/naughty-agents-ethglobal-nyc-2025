# Naughty Agents – Human-in-the-loop Security for On‑chain AI Agents

This is the frontend app for the Naughty Agents MVP. It demonstrates action hashing (A1), a mock reviewer workflow, and an end‑to‑end demo via a Python Agent API.

For the full repository overview and setup (including the Python server), see the project root README or follow the quick steps below.

## Quick Start

### Start the Python Agent API (Mock)
```powershell
cd ..\agent-simulator
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python server.py
# http://127.0.0.1:5055
```

### Start the Frontend
```powershell
pnpm install
# Optional override of API base:
# echo VITE_AGENT_API_URL=http://127.0.0.1:5055 > .env.local
pnpm dev
# Open http://localhost:5173
```

## Features
- Action Hash Builder (A1): canonicalize → Keccak‑256 → check status
- Agent API buttons: Compute, Check, Mock Blacklist, Health, Reset
- Full Demo Flow: blacklists the selected action via Agent API
- Reviewer Dashboard (Mock): flag, vote, resolve

## Configuration
- `VITE_AGENT_API_URL` in `.env.local` (default `http://127.0.0.1:5055`)
- Optional CDP: `VITE_CDP_PROJECT_ID`

## Notes
- On‑chain calls are currently mocked due to local Hardhat plugin issues.
- Contracts and addresses remain in the repo to enable future wiring.
