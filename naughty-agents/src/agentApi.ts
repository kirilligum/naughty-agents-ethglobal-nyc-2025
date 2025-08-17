// src/agentApi.ts

const API_BASE_URL = "http://127.0.0.1:5055";

export interface ReviewTask {
  parameters: {
    taskId: string; // These will likely be string representations from the JSON
    actionHash: string;
  };
  block_timestamp: string;
  transaction_hash: string;
}

export async function listReviewTasks(): Promise<ReviewTask[]> {
  const response = await fetch(`${API_BASE_URL}/tasks`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to fetch tasks: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
