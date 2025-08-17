import os
import json
from typing import Any, Dict

import requests


CDP_SQL_ENDPOINT = "https://api.cdp.coinbase.com/platform/v2/data/query/run"


def _require_env(name: str) -> str:
	val = os.getenv(name)
	if not val:
		raise RuntimeError(f"Missing required env: {name}")
	return val


def run_cdp_sql(sql: str) -> Dict[str, Any]:
	"""Execute a SQL query against the CDP Data API using a Bearer client token.

	Environment:
	- CDP_CLIENT_TOKEN: token with Data/SQL access (server-side only)
	"""
	token = _require_env("CDP_CLIENT_TOKEN")
	headers = {
		"Authorization": f"Bearer {token}",
		"Content-Type": "application/json",
	}
	resp = requests.post(CDP_SQL_ENDPOINT, headers=headers, data=json.dumps({"sql": sql}), timeout=30)
	if resp.status_code >= 300:
		raise RuntimeError(f"CDP SQL API error: {resp.status_code} {resp.text}")
	return resp.json()


