import type { NumFmt } from "@/lib/format"

export type CategoryId =
  | "baseline"
  | "operating-condition"
  | "internal-fault-proxy"
  | "supply-confounder"
  | "vibration-signature"
  | "proxy-fault"

export type CategoryMeta = {
  id: CategoryId
  label: string
  tone: string
  description: string
}

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

export type DiagnosticRole =
  | "primary_discriminant"
  | "confounder_check"
  | "normal_baseline"
  | "unaffected_channel"

export type MetricEvidence = {
  metric_name: string
  observed_value: number | string | null
  baseline_value: number | string | null
  unit?: string | null
  diagnostic_role: DiagnosticRole
  interpretation: string
}

export type ConditionExplanation = {
  condition_id: string
  classification_category: string
  classification_label: string
  physical_mechanism: string
  why_classified: string
  supporting_evidence: MetricEvidence[]
  discrimination_vs_confounders: string[]
  standing_limitations: string[]
}

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
  explanation?: ConditionExplanation
  raw: unknown
}

export type ConditionsResponse = { conditions: Condition[] }
export type ConditionResponse = { condition: Condition }
export type HealthResponse = { status: "ok"; service: string; version?: string }

// Raw shapes returned by the read-only FastAPI service (api/main.py).
// GET /api/conditions wraps each repository summary JSON as
// { condition_id, source_file, data, explanation }. These are the unmapped payloads the
// dashboard adapter in lib/conditions.ts consumes.
export type RawSummary = Record<string, unknown>
export type RawConditionRecord = {
  condition_id: string
  source_file: string
  data: RawSummary
  explanation?: ConditionExplanation
}
export type RawConditionsResponse = { count: number; conditions: RawConditionRecord[] }