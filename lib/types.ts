import type { NumFmt } from "@/lib/format"

export type CategoryId =
  | "baseline"
  | "operating-condition"
  | "internal-fault-proxy"
  | "supply-confounder"
  | "vibration-signature"
  | "proxy-fault"

export type KeyValue = { label: string; value: string }

export type MetricRow = {
  label: string
  unit?: string
  baseline?: number | null
  value?: number | null
  single?: number | null
  kind: "compare" | "single"
} & NumFmt

export type MetricGroup = { title: string; note?: string; rows: MetricRow[] }

export type Check = {
  name: string
  detail: string
  value?: number | null
  unit?: string
  compareValue?: number | null
  compareLabel?: string
  status: "converged" | "consistent" | "reported"
} & NumFmt

export type CuratedMetric = { id: string; label: string; unit?: string; description: string } & NumFmt
export type SpecificMetric = { conditionId: string; label: string; value: number | null; unit?: string } & NumFmt

export type Condition = {
  id: string
  title: string
  shortName: string
  originalFilename: string
  category: CategoryId
  conditionKind?: string
  scopeNote: string
  reportedQuantities: string[]
  provenance: KeyValue[]
  metricGroups: MetricGroup[]
  checks: Check[]
  comparison: Record<string, number | null>
  specificMetrics?: SpecificMetric[]
  raw: unknown
}

export type ConditionsResponse = { conditions: Condition[] }
export type ConditionResponse = { condition: Condition }
export type HealthResponse = { status: "ok"; service: string; version?: string }

import type { Condition, ConditionsResponse, HealthResponse } from "@/lib/types"

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? ""

async function request<T>(path: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured. Start the read-only FastAPI service and set the API URL.")
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { headers: { Accept: "application/json" } })
  if (!response.ok) throw new Error(`API request failed (${response.status}) for ${path}`)
  return response.json() as Promise<T>
}

export const api = {
  health: () => request<HealthResponse>("/api/health"),
  conditions: async () => (await request<ConditionsResponse>("/api/conditions")).conditions,
  condition: async (id: string) => (await request<{ condition: Condition }>(`/api/conditions/${encodeURIComponent(id)}`)).condition,
}
EOF

cat <<'EOF' > /vercel/share/v0-project/lib/conditions.ts
import type { CategoryId, CategoryMeta, Condition, CuratedMetric, SpecificMetric } from "@/lib/types"

export type { CategoryId, CategoryMeta, Condition, CuratedMetric, SpecificMetric }

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  baseline: { id: "baseline", label: "Baseline", tone: "text-sky-300 bg-sky-500/10 border-sky-500/30", description: "Healthy reference operating point used for comparison." },
  "operating-condition": { id: "operating-condition", label: "Operating-condition change", tone: "text-cyan-300 bg-cyan-500/10 border-cyan-500/30", description: "A change in operating conditions, not necessarily an internal fault." },
  "internal-fault-proxy": { id: "internal-fault-proxy", label: "Internal-fault proxy", tone: "text-amber-300 bg-amber-500/10 border-amber-500/30", description: "A controlled proxy for an internal electrical fault. Not an inter-turn-short model." },
  "supply-confounder": { id: "supply-confounder", label: "Supply-quality confounder", tone: "text-violet-300 bg-violet-500/10 border-violet-500/30", description: "A supply-side condition, not an internal motor fault." },
  "vibration-signature": { id: "vibration-signature", label: "Vibration signature (simulated)", tone: "text-teal-300 bg-teal-500/10 border-teal-500/30", description: "A simulated vibration-channel signature. Electrical model unchanged." },
  "proxy-fault": { id: "proxy-fault", label: "Proxy model", tone: "text-amber-300 bg-amber-500/10 border-amber-500/30", description: "A proxy for the behaviour of interest. Not a bar-resolved or calibrated model." },
}

export const CURATED_METRICS: CuratedMetric[] = [
  { id: "torque_ripple_nm", label: "Torque ripple", unit: "N·m", decimals: 4, description: "Peak-to-peak style electromagnetic torque ripple reported for the condition." },
  { id: "current_unbalance_pct", label: "Current unbalance", unit: "%", decimals: 3, description: "Reported current unbalance percentage." },
  { id: "negative_sequence_pct", label: "Negative-sequence current", unit: "%", decimals: 3, description: "Reported negative-sequence current percentage." },
  { id: "final_speed_difference_rpm", label: "Final speed difference", unit: "rpm", decimals: 3, description: "Condition-minus-baseline final speed difference." },
  { id: "final_slip_difference", label: "Final slip difference", decimals: 5, description: "Condition-minus-baseline final slip difference." },
]

export const CONDITION_COLORS: Record<string, string> = {
  healthy: "var(--chart-2)", fault_01: "var(--chart-1)", fault_02: "var(--chart-3)", fault_03: "var(--chart-5)", fault_04: "var(--chart-4)", fault_05: "var(--color-amber-400, oklch(0.82 0.15 85))",
}

export const PROJECT = {
  title: "Induction Motor Condition Monitoring",
  scope: "A software-only, physics-based reduced-order simulation of induction motor condition monitoring. All traces are simulated with literature-example parameters. This dashboard reports stored results only; it does not diagnose a physical machine.",
  parameterSet: "Provided by the API result metadata",
  parameterNotes: "Parameters are literature-example values, not measurements from a physical motor.",
  honesty: "The frontend is API-ready but is not connected until the read-only FastAPI service is running.",
}
EOF

cat <<'EOF' > /vercel/share/v0-project/.env.example
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
EOF
