import { useEffect, useState } from "react";
import { CONTRACT_ADDRESSES } from "../addresses";
import { checkHealth, getAgentApiBase } from "../agentApi";

export default function Header() {
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await checkHealth();
      if (mounted) setHealthy(ok);
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <header>
      <div className="header-inner">
        <div className="site-title">Naughty Agents<br />Human-in-the-loop Security</div>
        <div className="user-info flex-row-container" style={{ gap: 8 }}>
          <span className="badge">Network: {CONTRACT_ADDRESSES.network}</span>
          <span className={`badge ${healthy ? "badge-ok" : "badge-down"}`}>
            Agent API: {healthy ? "OK" : "DOWN"}
          </span>
          <small>({getAgentApiBase()})</small>
        </div>
      </div>
    </header>
  );
}


