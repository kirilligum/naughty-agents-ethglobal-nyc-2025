import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
# Enable CORS for requests from the default Vite dev server URL
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

@app.route('/')
def index():
    return "Naughty Agents API Server is running!"

import requests

# --- Constants ---
CDP_API_KEY = os.getenv("CDP_API_KEY")
CDP_SQL_API_URL = "https://api.cdp.coinbase.com/platform/v2/data/query/run"
REVIEW_ORACLE_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" # From previous deployment
ACTION_FLAGGED_SIGNATURE = "ActionFlagged(uint256,bytes32)"

@app.route('/tasks', methods=['GET'])
def get_review_tasks():
    if not CDP_API_KEY:
        return jsonify({"error": "CDP_API_KEY not configured in the environment."}), 500

    # Note: The table name 'base-sepolia.events.logs' is a guess based on typical
    # data warehouse schemas. The exact name may need to be verified in the CDP docs.
    sql_query = f"""
    SELECT
        parameters,
        block_timestamp,
        transaction_hash
    FROM
        `base-sepolia.events.logs`
    WHERE
        address = '{REVIEW_ORACLE_ADDRESS}'
    AND
        event_signature = '{ACTION_FLAGGED_SIGNATURE}'
    ORDER BY
        block_timestamp DESC
    """

    headers = {
        "Authorization": f"Bearer {CDP_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "sql": sql_query
    }

    try:
        response = requests.post(CDP_SQL_API_URL, headers=headers, json=payload)
        response.raise_for_status()  # Raises an HTTPError for bad responses (4xx or 5xx)

        data = response.json()
        # The frontend will receive an array of event objects
        return jsonify(data.get('result', []))

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to fetch data from Coinbase API: {e}"}), 502
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5055)
