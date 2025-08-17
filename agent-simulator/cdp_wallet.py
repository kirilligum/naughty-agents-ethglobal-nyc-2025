import base64
import json
import os
import time
from typing import Any, Dict

import requests
import jwt  # PyJWT


CDP_BASE = "https://api.cdp.coinbase.com"


def _require_env(name: str) -> str:
	val = os.getenv(name)
	if not val:
		raise RuntimeError(f"Missing required env: {name}")
	return val


def build_cdp_jwt(method: str, path: str, body: Dict[str, Any] | None = None) -> str:
	"""Build a short-lived JWT for CDP v2 auth.

	This is a simplified placeholder. Consult CDP docs to include required claims (iss, sub, nbf, exp, uri, method, body hash).
	"""
	project_id = _require_env("CDP_PROJECT_ID")
	api_key_name = _require_env("CDP_API_KEY_NAME")
	private_key_b64 = _require_env("CDP_API_KEY_PRIVATE_KEY")
	private_key = base64.b64decode(private_key_b64)

	now = int(time.time())
	claims = {
		"iss": project_id,
		"sub": api_key_name,
		"nbf": now,
		"exp": now + 120,
		"uri": path,
		"method": method.upper(),
	}
	# If body required in signature, include a deterministic hash field per CDP spec
	return jwt.encode(claims, private_key, algorithm="EdDSA")  # type: ignore[arg-type]


def _headers(token: str) -> Dict[str, str]:
	return {
		"Authorization": f"Bearer {token}",
		"Content-Type": "application/json",
	}


def send_blacklist_tx(chain_id: int, to_address: str, data_hex: str, value_wei: int = 0) -> Dict[str, Any]:
	"""Submit a transaction via CDP Server Wallets API. Returns response JSON.

	Note: You must fund the server wallet and set the correct contract address.
	"""
	path = "/platform/v2/wallets/server/transactions/send"
	token = build_cdp_jwt("POST", path, None)
	url = f"{CDP_BASE}{path}"
	payload = {
		"networkId": chain_id,
		"transaction": {
			"to": to_address,
			"value": hex(value_wei),
			"data": data_hex,
		},
	}
	resp = requests.post(url, headers=_headers(token), data=json.dumps(payload), timeout=30)
	if resp.status_code >= 300:
		raise RuntimeError(f"CDP send tx failed: {resp.status_code} {resp.text}")
	return resp.json()


