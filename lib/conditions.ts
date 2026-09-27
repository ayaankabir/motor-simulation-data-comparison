import type {
  CategoryId,
  CategoryMeta,
  Check,
  Condition,
  CuratedMetric,
  KeyValue,
  MetricGroup,
  MetricRow,
  RawConditionRecord,
  RawSummary,
} from "@/lib/types"
export type {
  CategoryId,
  CategoryMeta,
  Check,
  Condition,
  CuratedMetric,
  KeyValue,
  MetricGroup,
  MetricRow,
}

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

export const CONDITION_COLORS: Record<string, string> = { healthy: "var(--chart-2)", fault_01: "var(--chart-1)", fault_02: "var(--chart-3)", fault_03: "var(--chart-5)", fault_04: "var(--chart-4)", fault_05: "var(--color-amber-400, oklch(0.82 0.15 85))" }

export const PROJECT = {
  title: "Induction Motor Condition Monitoring",
  scope: "A software-only, physics-based reduced-order simulation of induction motor condition monitoring. All traces are simulated with literature-example parameters. This dashboard reports stored results only; it does not diagnose a physical machine.",
  parameterSet: "Provided by the API result metadata",
  parameterNotes: "Parameters are literature-example values, not measurements from a physical motor.",
  honesty: "The frontend is API-ready but is not connected until the read-only FastAPI service is running.",
}

/* -------------------------------------------------------------------------- */
/* Adapter: raw FastAPI summaries -> existing Condition[] presentation contract */
/* -------------------------------------------------------------------------- */

// Static presentation lookup. Values are copied verbatim from the repository's
// stored overview artifacts (results/fault_overview_summary.json conditions[].name
// and conditions[].affected_signal, and results/fault_overview_table.md column
// headers). No titles, short names, or quantity lists are generated here.
type Presentation = { title: string; shortName: string; category: CategoryId; reportedQuantities: string[] }

const PRESENTATION: Record<string, Presentation> = {
  healthy: {
    title: "Healthy baseline (balanced 50 Hz supply, 15.0 N m load)",
    shortName: "Healthy",
    category: "baseline",
    reportedQuantities: ["i_abc", "i_qd", "T_e", "speed", "slip (all simulated)"],
  },
  fault_01: {
    title: "Fault 01 — stator resistance imbalance (+10% phase A)",
    shortName: "Fault 01",
    category: "internal-fault-proxy",
    reportedQuantities: ["Stator currents (sequence components)", "qd currents", "torque ripple"],
  },
  fault_02: {
    title: "Condition 02 — increased mechanical load (+50%, 15.0 -> 22.5 N m)",
    shortName: "Cond. 02",
    category: "operating-condition",
    reportedQuantities: ["Speed", "slip", "torque", "current magnitude (i_qs, phase RMS)"],
  },
  fault_03: {
    title: "Fault 03 — supply voltage unbalance (phase C at 0.9 p.u.)",
    shortName: "Fault 03",
    category: "supply-confounder",
    reportedQuantities: ["Supply voltages", "phase currents", "torque ripple at 2*omega_e"],
  },
  fault_04: {
    title: "Fault 04 — bearing outer-race fault (BPFO vibration signature)",
    shortName: "Fault 04",
    category: "vibration-signature",
    reportedQuantities: ["Simulated accelerometer channel only (m/s^2)"],
  },
  fault_05: {
    title: "Fault 05 — rotor electrical asymmetry, severity 0.10 (broken-bar proxy)",
    shortName: "Fault 05",
    category: "proxy-fault",
    reportedQuantities: ["Stator current spectrum (sidebands)", "qd modulation tone", "small torque ripple"],
  },
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function asRecord(value: unknown): RawSummary | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RawSummary) : undefined
}

// Map the backend condition_id / source_file to the frontend id used by
// CONDITION_COLORS (healthy, fault_01..fault_05).
function idFromSourceFile(sourceFile: string): string {
  if (sourceFile.startsWith("healthy")) return "healthy"
  const match = sourceFile.match(/^fault_(\d{2})/)
  if (match) return `fault_${match[1]}`
  return sourceFile.replace(/_summary\.json$/, "")
}

// Select the metadata block that describes the condition actually studied.
function metaOf(data: RawSummary): RawSummary {
  return asRecord(data.fault_metadata) ?? asRecord(data.condition_metadata) ?? asRecord(data.healthy_metadata) ?? data
}

function scopeNoteOf(data: RawSummary): string {
  return asString(data.note) ?? asString(data.honesty) ?? asString(data.parameter_notes) ?? ""
}

function provenanceOf(meta: RawSummary, sourceFile: string): KeyValue[] {
  const rows: KeyValue[] = []
  const push = (label: string, raw: unknown) => {
    const text = asString(raw) ?? (typeof raw === "number" ? String(raw) : undefined)
    if (text !== undefined) rows.push({ label, value: text })
  }
  push("Parameter set", meta.parameter_name)
  push("Parameter provenance", meta.parameter_provenance)
  push("Trace provenance", meta.provenance)
  push("Scenario", meta.scenario_name)
  push("Solver", meta.solver)
  push("Park convention", meta.park_convention)
  push("Max step (s)", meta.max_step_s)
  push("End time (s)", meta.t_end_s)
  push("Initial condition", meta.initial_condition)
  push("Source file", sourceFile)
  return rows
}

// Which stored keys carry each curated comparison metric. Values are read
// directly; nothing is computed or estimated here.
const METRIC_SOURCES: Record<string, { baseline?: string[]; value: string[] }> = {
  torque_ripple_nm: { baseline: ["torque_ripple_healthy_nm"], value: ["torque_ripple_fault_nm", "torque_ripple_unbalance_nm"] },
  current_unbalance_pct: { baseline: ["current_unbalance_healthy_pct"], value: ["current_unbalance_fault_pct", "current_unbalance_unbalance_pct"] },
  negative_sequence_pct: { baseline: ["negative_sequence_healthy_pct"], value: ["negative_sequence_fault_pct", "negative_sequence_unbalance_pct"] },
  final_speed_difference_rpm: { value: ["final_speed_difference_rpm"] },
  final_slip_difference: { value: ["final_slip_difference"] },
}

function findNumber(sources: RawSummary[], keys: string[]): number | null {
  for (const source of sources) {
    for (const key of keys) {
      const value = asNumber(source[key])
      if (value !== null) return value
    }
  }
  return null
}

function comparisonOf(metrics: RawSummary, data: RawSummary): Record<string, number | null> {
  const comparison: Record<string, number | null> = {}
  for (const metric of CURATED_METRICS) {
    const sources = METRIC_SOURCES[metric.id]
    comparison[metric.id] = sources ? findNumber([metrics, data], sources.value) : null
  }
  return comparison
}

// Keys that describe the run rather than a measured quantity; excluded from the
// generic fallback group so only stored numeric quantities are displayed.
const NON_QUANTITY_KEYS = new Set([
  "max_step_s", "rtol", "atol", "t_end_s", "output_dt_s", "nfev", "njev", "n_eval",
  "supply_frequency_hz", "load_torque_nm", "tau_l_nm", "steady_window_t_start_s",
])

function metricGroupsOf(metrics: RawSummary, data: RawSummary): MetricGroup[] {
  const rows: MetricRow[] = []
  for (const metric of CURATED_METRICS) {
    const sources = METRIC_SOURCES[metric.id]
    if (!sources) continue
    const value = findNumber([metrics, data], sources.value)
    const baseline = sources.baseline ? findNumber([metrics], sources.baseline) : null
    if (baseline !== null) {
      rows.push({ label: metric.label, unit: metric.unit, kind: "compare", baseline, value, decimals: metric.decimals, sci: metric.sci })
    } else if (value !== null) {
      rows.push({ label: metric.label, unit: metric.unit, kind: "single", single: value, decimals: metric.decimals, sci: metric.sci })
    }
  }

  const groups: MetricGroup[] = []
  if (rows.length > 0) {
    groups.push({ title: "Reported comparison metrics", rows })
    return groups
  }

  // Fallback for a condition that reports none of the comparison metrics
  // (e.g. the healthy baseline): show the stored scalar quantities verbatim,
  // labelled by their stored key. No values are invented.
  const storedRows: MetricRow[] = []
  for (const [key, raw] of Object.entries(data)) {
    if (NON_QUANTITY_KEYS.has(key)) continue
    const value = asNumber(raw)
    if (value === null) continue
    storedRows.push({ label: key.replace(/_/g, " "), kind: "single", single: value })
  }
  if (storedRows.length > 0) {
    groups.push({ title: "Stored scalar quantities", rows: storedRows })
  }
  return groups
}

function checksOf(meta: RawSummary, data: RawSummary): Check[] {
  const checks: Check[] = []

  const message = asString(meta.message)
  if (message !== undefined) {
    checks.push({
      name: "message",
      detail: message,
      status: message.includes("successfully reached") ? "converged" : "reported",
    })
  }

  const healthyResidual = asNumber(data.healthy_power_balance_residual_rel)
  const conditionResidual =
    asNumber(data.fault_power_balance_residual_rel) ??
    asNumber(data.condition_power_balance_residual_rel) ??
    asNumber(data.power_balance_residual_rel)
  if (conditionResidual !== null) {
    checks.push({
      name: "power_balance_residual_rel",
      detail: "Relative power-balance residual reported by the summary.",
      value: conditionResidual,
      compareValue: healthyResidual,
      compareLabel: healthyResidual !== null ? "healthy_power_balance_residual_rel" : undefined,
      status: "consistent",
    })
  }

  const torqueBalance = asNumber(data.torque_balance_nm)
  if (torqueBalance !== null) {
    checks.push({
      name: "torque_balance_nm",
      detail: "Electromagnetic-minus-load-and-friction torque reported by the healthy summary.",
      unit: "N·m",
      value: torqueBalance,
      status: "consistent",
    })
  }

  return checks
}

export function toCondition(record: RawConditionRecord): Condition {
  const { source_file: sourceFile, data, explanation } = record
  const id = idFromSourceFile(sourceFile)
  const presentation: Presentation =
    PRESENTATION[id] ?? { title: id, shortName: id, category: "baseline", reportedQuantities: [] }
  const meta = metaOf(data)
  const metrics = asRecord(data.metrics) ?? {}

  return {
    id,
    title: presentation.title,
    shortName: presentation.shortName,
    originalFilename: sourceFile,
    category: presentation.category,
    conditionKind: asString(data.condition_kind),
    scopeNote: scopeNoteOf(data),
    reportedQuantities: presentation.reportedQuantities,
    provenance: provenanceOf(meta, sourceFile),
    metricGroups: metricGroupsOf(metrics, data),
    checks: checksOf(meta, data),
    comparison: comparisonOf(metrics, data),
    explanation,
    raw: data,
  }
}

export const conditions: Condition[] = []
export function setConditions(next: RawConditionRecord[]) {
  conditions.splice(0, conditions.length, ...next.map(toCondition))
}
export function getCondition(id: string) {
  return conditions.find((condition) => condition.id === id)
}
