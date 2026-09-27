import type { Condition, HealthResponse, RawConditionRecord, RawConditionsResponse } from "@/lib/types"

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? ""

async function request<T>(path: string): Promise<T> {
  if (!API_BASE_URL) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured. Start the read-only FastAPI service and set the API URL.")
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: { Accept: "application/json" } })
  if (!response.ok) throw new Error(`API request failed (${response.status}) for ${path}`)
  return response.json() as Promise<T>
}

// The read-only service returns raw repository summaries wrapped as
// { condition_id, source_file, data }. The dashboard adapter in
// lib/conditions.ts maps these into the presentation Condition contract.
export const api = {
  health: () => request<HealthResponse>("/api/health"),
  conditions: async () => (await request<RawConditionsResponse>("/api/conditions")).conditions as RawConditionRecord[],
  condition: async (id: string) => request<{ condition_id: string; source_file: string; data: unknown }>(`/api/conditions/${encodeURIComponent(id)}`),
}

export type { Condition }