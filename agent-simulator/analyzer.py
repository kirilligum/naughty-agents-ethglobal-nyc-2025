import json
import os
from typing import Any, Dict


def _heuristic_score(action: str, params: Dict[str, Any]) -> Dict[str, Any]:
	label = "benign"
	risk_score = 0.15
	reasons = []
	action_lower = (action or "").lower()
	try:
		amount = float(params.get("amount", 0)) if isinstance(params, dict) else 0
	except Exception:
		amount = 0
	if "transfer" in action_lower:
		risk_score += 0.2
		reasons.append("Action involves a transfer")
	if amount and amount > 1:
		risk_score += 0.35
		reasons.append("Large notional amount")
	if "to" in params and str(params.get("to", "")).lower() in {"0x0000000000000000000000000000000000000000"}:
		risk_score += 0.2
		reasons.append("Suspicious recipient")
	if risk_score >= 0.5:
		label = "suspicious"
	return {"riskScore": round(min(max(risk_score, 0.0), 1.0), 2), "label": label, "reasons": reasons}


def analyze_action(action: str, params: Dict[str, Any]) -> Dict[str, Any]:
	"""Return a GenKit-style assessment. Falls back to heuristics if no LLM configured."""
	# Optional LLM: set OPENAI_API_KEY to enable
	api_key = os.getenv("OPENAI_API_KEY")
	if not api_key:
		return _heuristic_score(action, params)
	try:
		# Lazy import so the module remains optional
		import openai  # type: ignore
		openai.api_key = api_key
		prompt = (
			"You are a compliance and risk assistant for on-chain AI agents.\n"
			"Given an action name and JSON params, output a JSON object with keys: riskScore (0-1), label ('benign'|'suspicious'), reasons (array of short strings).\n"
			"Be concise and deterministic.\n\n"
			f"Action: {action}\nParams JSON: {json.dumps(params, separators=(',', ':'), sort_keys=True)}\n"
		)
		resp = openai.ChatCompletion.create(  # compatible with legacy SDKs
			model="gpt-4o-mini",
			messages=[{"role": "system", "content": "Return only valid JSON."}, {"role": "user", "content": prompt}],
			temperature=0.1,
		)
		content = resp["choices"][0]["message"]["content"]
		data = json.loads(content)
		# Normalize
		return {
			"riskScore": float(data.get("riskScore", 0)),
			"label": str(data.get("label", "benign")),
			"reasons": list(data.get("reasons", [])),
		}
	except Exception:
		# Fall back gracefully
		return _heuristic_score(action, params)


