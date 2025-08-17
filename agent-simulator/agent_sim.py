import argparse
import json
import os
import time
from pathlib import Path
from typing import Any, Dict

from agent_utils import get_action_hash


USE_MOCK = True
MOCK_DB_FILE = Path(__file__).parent / "mock_blacklist.json"


def load_mock_db() -> Dict[str, Any]:
    if MOCK_DB_FILE.exists():
        with open(MOCK_DB_FILE, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return {"blacklisted": []}
    return {"blacklisted": []}


def save_mock_db(db: Dict[str, Any]) -> None:
    with open(MOCK_DB_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2)


def ensure_mock_db_initialized() -> None:
    if not MOCK_DB_FILE.exists():
        save_mock_db({"blacklisted": []})


def compute_action_hash(action: str, params: Dict[str, Any]) -> str:
    keccak_bytes = get_action_hash(action, params)
    return keccak_bytes.hex()


def simulate_review_and_blacklist(action_hash_hex: str) -> None:
    print("[MOCK] Submitting action for review...")
    time.sleep(0.3)
    print("[MOCK] Reviewers voting...")
    time.sleep(0.3)
    print("[MOCK] Reaching quorum and blacklisting...")
    time.sleep(0.3)

    db = load_mock_db()
    if action_hash_hex not in db.get("blacklisted", []):
        db["blacklisted"].append(action_hash_hex)
        save_mock_db(db)
    print(f"[MOCK] Completed. Action blacklisted: {action_hash_hex}")


def get_mock_status(action_hash_hex: str) -> int:
    db = load_mock_db()
    return 2 if action_hash_hex in db.get("blacklisted", []) else 0


def main() -> None:
    parser = argparse.ArgumentParser(description="AI Agent Simulator for Naughty Agents")
    parser.add_argument("--action", required=True, help="Action name, e.g., native_transfer")
    parser.add_argument("--params", help="Params as JSON string (e.g., '{\"to\":\"0x..\",\"amount\":123}')")
    parser.add_argument("--to", help="Shorthand for --action native_transfer: recipient address")
    parser.add_argument("--amount", type=int, help="Shorthand for --action native_transfer: amount")
    parser.add_argument("--check-only", action="store_true", help="Only compute the hash and check status")

    args = parser.parse_args()

    # Build params
    if args.params:
        try:
            params: Dict[str, Any] = json.loads(args.params)
        except json.JSONDecodeError as e:
            raise SystemExit(f"Invalid JSON for --params: {e}")
    else:
        params = {}
        if args.action == "native_transfer":
            if not args.to or args.amount is None:
                raise SystemExit("For native_transfer, provide --to and --amount or use --params JSON")
            params = {"to": args.to, "amount": args.amount}

    # Compute canonical hash
    action_hash_hex = compute_action_hash(args.action, params)
    print(f"Action: {args.action}")
    print(f"Params (canonicalized): {json.dumps(dict(sorted(params.items())), separators=(',', ':'))}")
    print(f"Keccak-256: {action_hash_hex}")

    if USE_MOCK:
        ensure_mock_db_initialized()
        if args.check_only:
            status = get_mock_status(action_hash_hex)
            print(f"Mock Status: {status} (2=Blacklisted, 0=Unknown)")
            return
        simulate_review_and_blacklist(action_hash_hex)
        status = get_mock_status(action_hash_hex)
        print(f"Final Mock Status: {status} (2=Blacklisted)")
        return

    # Real mode (disabled by default). To enable, set USE_MOCK=False and provide env vars.
    rpc_url = os.getenv("LOCAL_RPC_URL", "http://127.0.0.1:8545")
    action_registry_address = os.getenv("ACTION_REGISTRY_ADDRESS")
    if not action_registry_address:
        raise SystemExit("Set ACTION_REGISTRY_ADDRESS to query real ActionRegistry")

    try:
        from web3 import Web3
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        action_registry_abi = [
            {
                "constant": True,
                "inputs": [{"name": "actionHash", "type": "bytes32"}],
                "name": "getActionStatus",
                "outputs": [{"name": "", "type": "uint8"}],
                "stateMutability": "view",
                "type": "function",
            }
        ]
        contract = w3.eth.contract(address=Web3.to_checksum_address(action_registry_address), abi=action_registry_abi)
        status: int = contract.functions.getActionStatus(bytes.fromhex(action_hash_hex[2:])).call()
        print(f"On-chain Status: {status} (2=Blacklisted, 0=Unknown)")
    except Exception as exc:
        raise SystemExit(f"Failed to query on-chain status: {exc}")


if __name__ == "__main__":
    main()
