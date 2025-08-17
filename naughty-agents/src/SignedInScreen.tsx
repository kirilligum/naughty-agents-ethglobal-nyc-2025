import { useEffect, useState } from "react";
import { CONTRACT_ADDRESSES } from "./addresses";
import { publicClient } from "./viem";
import ActionRegistryAbi from "./artifacts/contracts/ActionRegistry.sol/ActionRegistry.json";
import WebOfTrustAbi from "./artifacts/contracts/WebOfTrust.sol/WebOfTrust.json";
import { keccak256, stringToBytes } from "viem";
import DemoActions from "./components/DemoActions";
import { hashAction, getActionStatus as getAgentStatus, blacklistAction, getAgentApiBase, checkHealth, resetMockDb } from "./agentApi";
import ReviewerDashboard from "./components/ReviewerDashboard";
import { runCdpSql } from "./cdpSql";

function canonicalizeAction(action: string, paramsObj: Record<string, unknown>): string {
  const sortedParams = Object.keys(paramsObj)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = (paramsObj as any)[k];
      return acc;
    }, {});
  return JSON.stringify({ action, params: sortedParams });
}

export default function SignedInScreen() {
  const [hashHex, setHashHex] = useState<string>("0x");
  const [status, setStatus] = useState<string>("");
  const [invite, setInvite] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [agentHealthy, setAgentHealthy] = useState<boolean | null>(null);
  const [agentMessage, setAgentMessage] = useState<string>("");
  const [sqlResult, setSqlResult] = useState<string>("");

  const [actionName, setActionName] = useState<string>("native_transfer");
  const [paramsJson, setParamsJson] = useState<string>(
    '{"to":"0x0000000000000000000000000000000000000001","amount":100}'
  );

  function getTemplateForAction(action: string): string | null {
    if (action === "native_transfer") {
      return '{"to":"0x0000000000000000000000000000000000000001","amount":100}';
    }
    if (action === "erc20_transfer") {
      return '{"token":"0x0000000000000000000000000000000000000000","to":"0x0000000000000000000000000000000000000002","amount":1000}';
    }
    if (action === "approve") {
      return '{"token":"0x0000000000000000000000000000000000000000","spender":"0x0000000000000000000000000000000000000003","amount":5000}';
    }
    return null;
  }

  function loadTemplate() {
    const t = getTemplateForAction(actionName.trim());
    if (t) setParamsJson(t);
  }

  const canonical = useState(() => {
    try {
      const parsed = JSON.parse(paramsJson || "{}");
      return canonicalizeAction(actionName, parsed);
    } catch {
      return "";
    }
  });

  const computedHash = useState(() => {
    try {
      if (!canonical[0]) return "0x";
      return keccak256(stringToBytes(canonical[0]));
    } catch {
      return "0x";
    }
  });

  async function checkStatus(inputHash?: string) {
    setError("");
    try {
      const h = (inputHash || hashHex) as `0x${string}`;
      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.actionRegistry as `0x${string}`,
        abi: ActionRegistryAbi.abi,
        functionName: "getActionStatus",
        args: [h],
      });
      setStatus(String(result));
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function apiComputeHash() {
    setError("");
    try {
      const parsed = JSON.parse(paramsJson || "{}");
      const h = await hashAction(actionName, parsed);
      const prefixed = h.startsWith("0x") ? h : `0x${h}`;
      setHashHex(prefixed);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  }

  async function apiCheckStatus() {
    setError("");
    try {
      const candidate = hashHex && hashHex !== "0x" ? hashHex : (computedHash[0] as string);
      const n = await getAgentStatus(candidate);
      setStatus(String(n));
    } catch (e: any) {
      setError(e.message || String(e));
    }
  }

  async function apiMockBlacklist() {
    setError("");
    try {
      const parsed = JSON.parse(paramsJson || "{}");
      const { hash, status } = await blacklistAction(actionName, parsed);
      const prefixed = hash.startsWith("0x") ? hash : `0x${hash}`;
      setHashHex(prefixed);
      setStatus(String(status));
    } catch (e: any) {
      setError(e.message || String(e));
    }
  }

  async function apiHealthCheck() {
    const ok = await checkHealth();
    setAgentHealthy(ok);
    setAgentMessage(ok ? "Agent API reachable" : "Agent API not reachable");
  }

  // Run an initial health check on mount, so the badge reflects real status
  useEffect(() => {
    (async () => {
      try {
        const ok = await checkHealth();
        setAgentHealthy(ok);
        setAgentMessage(ok ? "Agent API reachable" : "Agent API not reachable");
      } catch {
        setAgentHealthy(false);
        setAgentMessage("Agent API not reachable");
      }
    })();
  }, []);

  async function apiResetMockDb() {
    setAgentMessage("");
    const ok = await resetMockDb();
    setAgentMessage(ok ? "Mock DB cleared" : "Failed to reset mock DB");
  }

  async function runSampleSql() {
    setError("");
    setSqlResult("");
    try {
      const data = await runCdpSql("SELECT * FROM base.events LIMIT 1");
      setSqlResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function createInviteReadOnly() {
    setError("");
    try {
      const data = publicClient.encodeFunctionData({
        abi: WebOfTrustAbi.abi,
        functionName: "createInviteCode",
        args: [],
      });
      setInvite(`calldata: ${data.slice(0, 18)}...`);
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="flex-col-container">
      <h2>Welcome</h2>
      <div className="card">
        <h3>Local Contracts</h3>
        <ul>
          <li>Network: {CONTRACT_ADDRESSES.network}</li>
          <li>ActionRegistry: {CONTRACT_ADDRESSES.actionRegistry}</li>
          <li>WebOfTrust: {CONTRACT_ADDRESSES.webOfTrust}</li>
          <li>ReviewOracle: {CONTRACT_ADDRESSES.reviewOracle}</li>
          <li>SecurityModule: {CONTRACT_ADDRESSES.securityModule}</li>
        </ul>
        <div>
          <span className={`badge ${agentHealthy ? "badge-ok" : "badge-down"}`}>
            Agent API {agentHealthy ? "OK" : "DOWN"}
          </span>
        </div>
      </div>

      <div className="card">
        <h3>Action Hash Builder (A1)</h3>
        <small>Agent API: {getAgentApiBase()}</small>
        <label>Action</label>
        <input value={actionName} onChange={(e) => setActionName(e.target.value)} />
        <label>Params JSON</label>
        <textarea value={paramsJson} onChange={(e) => setParamsJson(e.target.value)} rows={4} />
        <div>
          <button onClick={loadTemplate}>Load Template</button>
          <small style={{ marginLeft: 8 }}>Known actions: native_transfer, erc20_transfer, approve</small>
        </div>
        <div>
          <small>Canonical JSON:</small>
          <pre>{canonical[0]}</pre>
        </div>
        <div>
          <small>Keccak-256:</small>
          <pre>{computedHash[0]}</pre>
          </div>
        <button onClick={() => checkStatus(computedHash[0])}>Check Status of Computed Hash</button>
        <button onClick={() => setStatus("2")}>Mock Blacklist Action</button>
        <div style={{ marginTop: 8 }}>
          <button onClick={apiComputeHash}>Compute Hash (Agent API)</button>
          <button onClick={apiCheckStatus} style={{ marginLeft: 8 }}>Check Status (Agent API)</button>
          <button onClick={apiMockBlacklist} style={{ marginLeft: 8 }}>Mock Blacklist (Agent API)</button>
          <button onClick={apiHealthCheck} style={{ marginLeft: 8 }}>Agent API Health</button>
          <button onClick={apiResetMockDb} style={{ marginLeft: 8 }}>Reset Mock DB</button>
          <button onClick={runSampleSql} style={{ marginLeft: 8 }}>Run CDP SQL (sample)</button>
          {agentHealthy !== null && (
            <span style={{ marginLeft: 8 }}>Health: {agentHealthy ? "OK" : "DOWN"}</span>
          )}
          {agentMessage && (
            <span style={{ marginLeft: 8 }}>{agentMessage}</span>
            )}
          </div>
        </div>

      <div className="card">
        <h3>ActionRegistry.getActionStatus (Raw Input)</h3>
        <input
          placeholder="0x... action hash"
          value={hashHex}
          onChange={(e) => setHashHex(e.target.value)}
        />
        <button onClick={() => checkStatus()}>Check</button>
        {status !== "" && <p>Status: {status}</p>}
      </div>

      <div className="card">
        <h3>WebOfTrust.createInviteCode (preview)</h3>
        <button onClick={createInviteReadOnly}>Preview calldata</button>
        {invite && <p>{invite}</p>}
      </div>

      <DemoActions
        onActionBlacklisted={() => checkStatus(computedHash[0])}
        actionName={actionName}
        paramsJson={paramsJson}
      />

      <ReviewerDashboard actionName={actionName} paramsJson={paramsJson} />

      {sqlResult && (
        <div className="card" style={{ alignItems: "stretch" }}>
          <h3>CDP SQL Result</h3>
          <pre style={{ textAlign: "left", overflowX: "auto" }}>{sqlResult}</pre>
        </div>
      )}

      {error && (
        <div className="error-panel">
          <strong>Error</strong>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: 6 }}>{error}</pre>
        </div>
      )}
    </div>
  );
}
