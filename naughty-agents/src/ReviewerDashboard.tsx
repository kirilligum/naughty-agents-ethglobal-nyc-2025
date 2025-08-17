import { useState, useEffect, useCallback } from "react";
import { listReviewTasks, type ReviewTask } from "./agentApi";

function ReviewerDashboard() {
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [error, setError] = useState<string | null>(null);

  const refreshTasks = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const fetchedTasks = await listReviewTasks();
      setTasks(fetchedTasks);
      setStatus("success");
    } catch (e: any) {
      setError(e.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Reviewer Dashboard</h2>
        <button className="button button--secondary" onClick={refreshTasks} disabled={status === 'loading'}>
          {status === 'loading' ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {status === 'loading' && <p>Loading tasks...</p>}
      {status === 'error' && <p className="error">Error fetching tasks: {error}</p>}

      {status === 'success' && (
        <div className="task-list">
          {tasks.length === 0 ? (
            <p>No review tasks available.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Hash</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, index) => (
                  <tr key={index}>
                    <td>{new Date(task.block_timestamp).toLocaleString()}</td>
                    <td><code>{task.parameters.actionHash ? task.parameters.actionHash.slice(0, 10) : 'N/A'}...</code></td>
                    <td><a href={`https://sepolia.basescan.org/tx/${task.transaction_hash}`} target="_blank" rel="noopener noreferrer">View Tx</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default ReviewerDashboard;
