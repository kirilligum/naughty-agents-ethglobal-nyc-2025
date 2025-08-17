import { useEffect, useState } from "react";
import {
  flagForReview,
  listReviewTasks,
  resolveTask,
  voteOnTask,
  type ReviewTask,
} from "../agentApi";

interface ReviewerDashboardProps {
  actionName?: string;
  paramsJson?: string;
}

export default function ReviewerDashboard({ actionName, paramsJson }: ReviewerDashboardProps) {
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const t = await listReviewTasks();
      setTasks(t);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onFlag() {
    setMessage("");
    setError("");
    try {
      const act = (actionName || "native_transfer").trim();
      let params: Record<string, unknown> = { to: "0x0000000000000000000000000000000000000001", amount: 100 };
      if (paramsJson && paramsJson.trim()) {
        try { params = JSON.parse(paramsJson); } catch {}
      }
      const res = await flagForReview(act, params);
      setMessage("Flagged for review" + (res?.ai ? ` (AI: ${res.ai.label}, ${res.ai.riskScore})` : ""));
      await refresh();
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function onVote(taskId: number, support: boolean) {
    setMessage("");
    setError("");
    try {
      await voteOnTask(taskId, support);
      await refresh();
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function onResolve(taskId: number) {
    setMessage("");
    setError("");
    try {
      const res = await resolveTask(taskId);
      if (res.resolved) setMessage(res.blacklisted ? "Resolved: Blacklisted" : "Resolved");
      await refresh();
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  return (
    <div className="card">
      <h3>Reviewer Dashboard (Mock)</h3>
      <button onClick={onFlag}>Flag Current Action For Review</button>
      <button onClick={refresh} style={{ marginLeft: 8 }}>Refresh</button>
      {message && <span style={{ marginLeft: 8 }}>{message}</span>}
      {loading && <p>Loading...</p>}
      {error && (
        <div style={{ color: "red", marginTop: 8 }}>
          <pre>{error}</pre>
        </div>
      )}
      <div style={{ marginTop: 10 }}>
        {tasks.length === 0 ? (
          <p>No tasks</p>
        ) : (
          <table style={{ width: "100%", fontSize: "0.9em" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>ID</th>
                <th style={{ textAlign: "left" }}>Hash</th>
                <th style={{ textAlign: "left" }}>Action</th>
                <th style={{ textAlign: "left" }}>AI</th>
                <th style={{ textAlign: "left" }}>Votes</th>
                <th style={{ textAlign: "left" }}>Resolved</th>
                <th style={{ textAlign: "left" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.hash.slice(0, 12)}...</td>
                  <td>{t.action}</td>
                  <td>
                    {t.ai ? (
                      <div>
                        <div>{t.ai.label} ({t.ai.riskScore})</div>
                        {t.ai.reasons?.length ? (
                          <details>
                            <summary>reasons</summary>
                            <ul style={{ margin: 0, paddingLeft: 16 }}>
                              {t.ai.reasons.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </details>
                        ) : null}
                      </div>
                    ) : (
                      <span>n/a</span>
                    )}
                  </td>
                  <td>for {t.votesFor} / against {t.votesAgainst}</td>
                  <td>{t.resolved ? (t.txHash ? `yes (${t.txHash.slice(0, 10)}...)` : "yes") : "no"}</td>
                  <td>
                    <button onClick={() => onVote(t.id, true)}>Vote For</button>
                    <button onClick={() => onVote(t.id, false)} style={{ marginLeft: 6 }}>Vote Against</button>
                    <button
                      onClick={() => onResolve(t.id)}
                      style={{ marginLeft: 6 }}
                      disabled={!(t.votesFor >= 2 && (t.ai ? t.ai.riskScore >= 0.5 : true))}
                      title={!(t.votesFor >= 2 && (t.ai ? t.ai.riskScore >= 0.5 : true)) ? "Need quorum and AI risk >= 0.5" : ""}
                    >
                      Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


