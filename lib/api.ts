import type { Condition, ConditionsResponse, HealthResponse } from "@/lib/types"

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? ""

async function request<T>(path: string): Promise<T> {
  if (!API_BASE_URL) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured. Start the read-only FastAPI service and set the API URL.")
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: { Accept: "application/json" } })
  if (!response.ok) throw new Error(`API request failed (${response.status}) for ${path}`)
  return response.json() as Promise<T>
}

export const api = {
  health: () => request<HealthResponse>("/api/health"),
  conditions: async () => (await request<ConditionsResponse>("/api/conditions")).conditions,
  condition: async (id: string) => (await request<{ condition: Condition }>(`/api/conditions/${encodeURIComponent(id)}`)).condition,
}
