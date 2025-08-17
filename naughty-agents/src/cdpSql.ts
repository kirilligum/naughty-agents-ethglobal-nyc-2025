const CDP_SQL_ENDPOINT =
  (import.meta as any).env?.DEV
    ? "/cdp/platform/v2/data/query/run"
    : "https://api.cdp.coinbase.com/platform/v2/data/query/run";

function getClientToken(): string {
  const token = (import.meta as any).env?.VITE_CDP_CLIENT_TOKEN as string | undefined;
  if (!token) {
    throw new Error("VITE_CDP_CLIENT_TOKEN is not set. Add it to naughty-agents/.env.local");
  }
  return token;
}

export async function runCdpSql(sql: string): Promise<any> {
  const token = getClientToken();
  const res = await fetch(CDP_SQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });
  if (!res.ok) {
    let detail = "";
    try { detail = await res.text(); } catch {}
    throw new Error(`CDP SQL API error: ${res.status} ${detail}`);
  }
  return res.json();
}


