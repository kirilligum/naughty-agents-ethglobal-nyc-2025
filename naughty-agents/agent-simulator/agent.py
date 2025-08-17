# naughty-agents/agent-simulator/agent.py

import json
from web3 import Web3

def get_action_hash(action_name, params):
  """
  Calculates the Keccak-256 hash of a transaction intent according to the
  Naughty Agents Atomic Action Hashing Standard.
  """
  payload = {
    "action": action_name,
    "params": dict(sorted(params.items()))
  }
  compact_payload = json.dumps(payload, separators=(',', ':'))
  return Web3.keccak(text=compact_payload).hex()

def simulate_benign_action():
  """Simulates the agent proposing a safe, everyday transaction."""
  print("\n--- Simulation: Benign Agent Behavior ---")
  action_name = "safe_transfer"
  params = {
    "to": "0xRecipientSafe00000000000000000000000000",
    "amount": 1.5,
    "token": "USDC"
  }

  action_hash = get_action_hash(action_name, params)

  print(f"Agent proposes action: {action_name}")
  print(f"Parameters: {json.dumps(params, indent=2)}")
  print(f"Resulting Action Hash: {action_hash}")
  print("--- End Simulation ---")


def simulate_hijacked_action():
  """Simulates the agent being hijacked and proposing a malicious action."""
  print("\n--- Simulation: HIJACKED Agent Behavior ---")
  action_name = "native_transfer"
  params = {
    "to": "0xHackerAddress00000000000000000000000000",
    "amount": 1000,
    "chain": "ethereum"
  }

  action_hash = get_action_hash(action_name, params)

  print("!!! AGENT COMPROMISED !!!")
  print(f"Agent proposes malicious action: {action_name}")
  print(f"Parameters: {json.dumps(params, indent=2)}")
  print(f"Resulting Action Hash: {action_hash}")
  print("--- End Simulation ---")


if __name__ == "__main__":
  import sys

  if len(sys.argv) != 2 or sys.argv[1] not in ["benign", "hijacked"]:
    print("Usage: python agent.py [benign|hijacked]")
    sys.exit(1)

  mode = sys.argv[1]

  if mode == "benign":
    simulate_benign_action()
  elif mode == "hijacked":
    simulate_hijacked_action()
