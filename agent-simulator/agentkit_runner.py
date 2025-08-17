import os
from typing import Any, Dict


def is_agentkit_available() -> bool:
	try:
		import coinbase_agentkit  # type: ignore
		return True
	except Exception:
		return False


def run_agent_action(action: str, params: Dict[str, Any]) -> Dict[str, Any]:
	"""Attempt to execute an agent action via Coinbase AgentKit.

	If AgentKit or required credentials are missing, returns a descriptive error
	instead of raising. This keeps the server functional without AgentKit.
	"""
	if not is_agentkit_available():
		return {
			"ok": False,
			"error": "coinbase_agentkit not installed",
			"hint": "pip install coinbase-agentkit and set CDP_PROJECT_ID, CDP_API_KEY_NAME, CDP_API_KEY_PRIVATE_KEY",
		}

	project_id = os.getenv("CDP_PROJECT_ID")
	api_key_name = os.getenv("CDP_API_KEY_NAME")
	api_key_private_key = os.getenv("CDP_API_KEY_PRIVATE_KEY")
	if not project_id or not api_key_name or not api_key_private_key:
		return {
			"ok": False,
			"error": "Missing CDP credentials in environment",
			"required": ["CDP_PROJECT_ID", "CDP_API_KEY_NAME", "CDP_API_KEY_PRIVATE_KEY"],
		}

	try:
		# Lazy import to keep dependency optional
		from coinbase_agentkit import (  # type: ignore
			AgentKit,
			AgentKitOptions,
			Network,
		)

		# Default to Base Sepolia for this MVP
		network = Network.BASE_SEPOLIA
		options = AgentKitOptions(
			cdp_project_id=project_id,
			cdp_api_key_name=api_key_name,
			cdp_api_key_private_key=api_key_private_key,
			network=network,
		)
		agent_kit = AgentKit.from_options(options)

		# Minimal action routing. Extend as needed.
		action_name = (action or "").strip().lower()
		if action_name == "native_transfer":
			to = str(params.get("to", ""))
			amount = params.get("amount", 0)
			# AgentKit wallet API names may differ; this is intentionally generic.
			# Replace with the exact method for your AgentKit version.
			try:
				# Example placeholder call; adjust to your AgentKit API.
				result = agent_kit.wallet.transfer_native(
					to_address=to,
					amount=float(amount),
				)
				return {"ok": True, "result": result}
			except Exception as exc:
				return {"ok": False, "error": f"transfer failed: {exc}"}

		return {"ok": False, "error": f"Unsupported action: {action_name}"}

	except Exception as exc:
		return {"ok": False, "error": str(exc)}


