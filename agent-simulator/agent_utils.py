import json
from web3 import Web3

def get_action_hash(action_name: str, params: dict) -> bytes:
    """Calculates the Keccak-256 hash of a canonicalized action payload.

    The payload is constructed as a JSON object with 'action' and 'params' keys.
    'params' are sorted alphabetically by key, and the entire JSON is serialized
    into a compact string with no whitespace before hashing.

    Args:
        action_name: The name of the function being called (e.g., "native_transfer").
        params: A dictionary of the arguments for the action.

    Returns:
        The Keccak-256 hash of the canonicalized action payload as bytes.
    """
    payload = {
        "action": action_name,
        "params": dict(sorted(params.items()))
    }
    # Serialize to a compact string with no whitespace
    compact_payload = json.dumps(payload, separators=(',', ':'))
    
    # Hash the string using Keccak-256
    return Web3.keccak(text=compact_payload)

# Example Usage (for testing within the file)
if __name__ == "__main__":
    # Example from spec
    hash1 = get_action_hash("native_transfer", {"to": "0x0000000000000000000000000000000000000001", "amount": 100})
    print(f"Hash for native_transfer: {hash1.hex()}")

    # Example with different order, should produce same hash
    hash2 = get_action_hash("native_transfer", {"amount": 100, "to": "0x0000000000000000000000000000000000000001"})
    print(f"Hash for native_transfer (reordered params): {hash2.hex()}")

    # Example with different action/params
    hash3 = get_action_hash("approve", {"spender": "0xabc...", "tokenId": 123})
    print(f"Hash for approve: {hash3.hex()}")
