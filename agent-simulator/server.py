import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from web3 import Web3

from agent_utils import get_action_hash
from analyzer import analyze_action
from cdp_wallet import send_blacklist_tx
from agentkit_runner import run_agent_action
from cdp_sql import run_cdp_sql
from agent_sim import (
	compute_action_hash,
	get_mock_status,
	simulate_review_and_blacklist,
	ensure_mock_db_initialized,
	save_mock_db,
	load_mock_db,
)

app = Flask(__name__)
CORS(app)


@app.route("/hash", methods=["POST"])
def hash_action():
	data = request.get_json(force=True, silent=True) or {}
	action = data.get("action")
	params = data.get("params", {})
	if not action or not isinstance(params, dict):
		return jsonify({"error": "Provide 'action' and 'params' (object)."}), 400
	action_hash_hex = compute_action_hash(action, params)
	return jsonify({"hash": action_hash_hex})


@app.route("/status/<action_hash>", methods=["GET"])
def status_action(action_hash: str):
	ensure_mock_db_initialized()
	status = get_mock_status(action_hash)
	return jsonify({"status": status})


@app.route("/blacklist", methods=["POST"])
def blacklist_action():
	data = request.get_json(force=True, silent=True) or {}
	action = data.get("action")
	params = data.get("params", {})
	if not action or not isinstance(params, dict):
		return jsonify({"error": "Provide 'action' and 'params' (object)."}), 400
	action_hash_hex = compute_action_hash(action, params)
	simulate_review_and_blacklist(action_hash_hex)
	return jsonify({"hash": action_hash_hex, "status": 2})


@app.route("/health", methods=["GET"])
def health():
	return jsonify({"ok": True})

@app.route("/reset", methods=["POST"])
def reset():
	# Clear the mock blacklist DB
	try:
		save_mock_db({"blacklisted": []})
		return jsonify({"ok": True})
	except Exception as exc:
		return jsonify({"ok": False, "error": str(exc)}), 500


# --- Reviewer Workflow (Mock) ---

def _ensure_tasks_array():
	db = load_mock_db()
	if "tasks" not in db or not isinstance(db.get("tasks"), list):
		db["tasks"] = []
		save_mock_db(db)
	return db


@app.route("/flag", methods=["POST"])
def flag_action():
	data = request.get_json(force=True, silent=True) or {}
	action = data.get("action")
	params = data.get("params", {})
	if not action or not isinstance(params, dict):
		return jsonify({"error": "Provide 'action' and 'params' (object)."}), 400
	# compute hash
	action_hash_hex = compute_action_hash(action, params)
	db = _ensure_tasks_array()
	# AI assessment
	ai = analyze_action(action, params)
	tasks = db["tasks"]
	task = {
		"id": len(tasks),
		"hash": action_hash_hex,
		"action": action,
		"params": params,
		"votesFor": 0,
		"votesAgainst": 0,
		"resolved": False,
		"ai": ai,
	}
	tasks.append(task)
	save_mock_db(db)
	return jsonify({"taskId": task["id"], "hash": action_hash_hex, "ai": ai})


@app.route("/tasks", methods=["GET"])
def list_tasks():
	db = _ensure_tasks_array()
	return jsonify({"tasks": db["tasks"]})


@app.route("/agent/run", methods=["POST"])
def agent_run():
	data = request.get_json(force=True, silent=True) or {}
	action = data.get("action")
	params = data.get("params", {})
	if not action or not isinstance(params, dict):
		return jsonify({"ok": False, "error": "Provide 'action' and 'params' (object)."}), 400
	result = run_agent_action(action, params)
	return jsonify(result)


@app.route("/cdp/sql", methods=["POST"])
def cdp_sql():
	data = request.get_json(force=True, silent=True) or {}
	sql = data.get("sql")
	if not sql or not isinstance(sql, str):
		return jsonify({"ok": False, "error": "Provide 'sql' (string)."}), 400
	try:
		res = run_cdp_sql(sql)
		return jsonify({"ok": True, "data": res})
	except Exception as exc:
		return jsonify({"ok": False, "error": str(exc)}), 500


@app.route("/vote", methods=["POST"])
def vote_task():
	data = request.get_json(force=True, silent=True) or {}
	task_id = data.get("taskId")
	support = data.get("support")
	if task_id is None or support is None:
		return jsonify({"error": "Provide 'taskId' and 'support' (bool)."}), 400
	db = _ensure_tasks_array()
	tasks = db["tasks"]
	if not (0 <= int(task_id) < len(tasks)):
		return jsonify({"error": "Invalid taskId"}), 400
	task = tasks[int(task_id)]
	if task.get("resolved"):
		return jsonify({"error": "Task already resolved"}), 400
	if bool(support):
		task["votesFor"] += 1
	else:
		task["votesAgainst"] += 1
	save_mock_db(db)
	return jsonify({"taskId": int(task_id), "votesFor": task["votesFor"], "votesAgainst": task["votesAgainst"]})


@app.route("/resolve", methods=["POST"])
def resolve_task():
	data = request.get_json(force=True, silent=True) or {}
	task_id = data.get("taskId")
	if task_id is None:
		return jsonify({"error": "Provide 'taskId'."}), 400
	db = _ensure_tasks_array()
	tasks = db["tasks"]
	if not (0 <= int(task_id) < len(tasks)):
		return jsonify({"error": "Invalid taskId"}), 400
	task = tasks[int(task_id)]
	if task.get("resolved"):
		return jsonify({"taskId": int(task_id), "resolved": True, "txHash": task.get("txHash")}), 200
	# quorum rule: votesFor >= 2
	if task.get("votesFor", 0) >= 2:
		task["resolved"] = True
		# Persist mock DB status for compatibility
		simulate_review_and_blacklist(task["hash"])  # updates blacklisted set
		# Attempt on-chain tx via server wallet if env configured
		tx_hash = None
		try:
			chain_id = int(os.getenv("BASE_SEPOLIA_CHAIN_ID", "84532"))
			contract_addr = os.getenv("ACTION_REGISTRY_ADDRESS", "0x0000000000000000000000000000000000000000")
			# encode blacklist(bytes32) calldata for the task hash
			def encode_blacklist_call(hash_hex: str) -> str:
				selector = Web3.keccak(text="blacklist(bytes32)")[:4]
				arg = bytes.fromhex(hash_hex[2:]) if hash_hex.startswith("0x") else bytes.fromhex(hash_hex)
				if len(arg) != 32:
					arg = (b"\x00" * (32 - len(arg))) + arg
				return "0x" + (selector + arg).hex()

			if contract_addr != "0x0000000000000000000000000000000000000000":
				calldata = encode_blacklist_call(task["hash"])
				resp = send_blacklist_tx(chain_id, contract_addr, calldata)
				tx_hash = resp.get("transactionHash") or resp.get("hash")
		except Exception:
			pass
		task["txHash"] = tx_hash
		save_mock_db(db)
		return jsonify({"taskId": int(task_id), "resolved": True, "blacklisted": True, "txHash": tx_hash})
	else:
		return jsonify({"taskId": int(task_id), "resolved": False, "reason": "Quorum not reached"}), 200


if __name__ == "__main__":
	ensure_mock_db_initialized()
	app.run(host="127.0.0.1", port=5055)
