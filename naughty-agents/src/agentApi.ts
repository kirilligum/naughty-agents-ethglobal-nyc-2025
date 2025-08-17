const AGENT_API_BASE: string = (import.meta as any).env?.VITE_AGENT_API_URL || "http://127.0.0.1:5055";

type Json = Record<string, unknown>;

export async function hashAction(action: string, params: Json): Promise<string> {
	const res = await fetch(`${AGENT_API_BASE}/hash`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ action, params }),
	});
	if (!res.ok) throw new Error(`hashAction failed: ${res.status}`);
	const data = await res.json();
	return data.hash as string;
}

export async function getActionStatus(hashHex: string): Promise<number> {
	const clean = hashHex.startsWith("0x") ? hashHex : `0x${hashHex}`;
	const res = await fetch(`${AGENT_API_BASE}/status/${clean}`);
	if (!res.ok) throw new Error(`getActionStatus failed: ${res.status}`);
	const data = await res.json();
	return data.status as number;
}

export async function blacklistAction(action: string, params: Json): Promise<{ hash: string; status: number }>{
	const res = await fetch(`${AGENT_API_BASE}/blacklist`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ action, params }),
	});
	if (!res.ok) throw new Error(`blacklistAction failed: ${res.status}`);
	return (await res.json()) as { hash: string; status: number };
}

export function getAgentApiBase(): string {
	return AGENT_API_BASE;
}

export async function checkHealth(): Promise<boolean> {
	try {
		const res = await fetch(`${AGENT_API_BASE}/health`);
		if (!res.ok) return false;
		const data = await res.json();
		return Boolean(data?.ok);
	} catch {
		return false;
	}
}

export async function resetMockDb(): Promise<boolean> {
	const res = await fetch(`${AGENT_API_BASE}/reset`, { method: "POST" });
	if (!res.ok) return false;
	try {
		const data = await res.json();
		return Boolean(data?.ok);
	} catch {
		return true;
	}
}

// Reviewer workflow (mock)
export type ReviewTask = {
  id: number;
  hash: string;
  action: string;
  params: Json;
  votesFor: number;
  votesAgainst: number;
  resolved: boolean;
  ai?: { riskScore: number; label: string; reasons: string[] };
  txHash?: string;
};

export async function flagForReview(action: string, params: Json): Promise<{ taskId: number; hash: string; ai?: ReviewTask["ai"] }>{
  const res = await fetch(`${AGENT_API_BASE}/flag`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params }),
  });
  if (!res.ok) throw new Error(`flagForReview failed: ${res.status}`);
  return (await res.json()) as { taskId: number; hash: string; ai?: ReviewTask["ai"] };
}

export async function listReviewTasks(): Promise<ReviewTask[]>{
  const res = await fetch(`${AGENT_API_BASE}/tasks`);
  if (!res.ok) throw new Error(`listReviewTasks failed: ${res.status}`);
  const data = await res.json();
  return (data?.tasks || []) as ReviewTask[];
}

export async function voteOnTask(taskId: number, support: boolean): Promise<{ taskId: number; votesFor: number; votesAgainst: number }>{
  const res = await fetch(`${AGENT_API_BASE}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId, support }),
  });
  if (!res.ok) throw new Error(`voteOnTask failed: ${res.status}`);
  return (await res.json()) as { taskId: number; votesFor: number; votesAgainst: number };
}

export async function resolveTask(taskId: number): Promise<{ taskId: number; resolved: boolean; blacklisted?: boolean; reason?: string }>{
  const res = await fetch(`${AGENT_API_BASE}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId }),
  });
  if (!res.ok) throw new Error(`resolveTask failed: ${res.status}`);
  return (await res.json()) as { taskId: number; resolved: boolean; blacklisted?: boolean; reason?: string };
}


