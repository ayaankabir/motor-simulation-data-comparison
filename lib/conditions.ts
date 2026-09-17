import healthyRaw from "@/data/healthy.json"
import fault01Raw from "@/data/fault_01.json"
import fault02Raw from "@/data/fault_02.json"
import fault03Raw from "@/data/fault_03.json"
import fault04Raw from "@/data/fault_04.json"
import fault05Raw from "@/data/fault_05.json"
import type { NumFmt } from "@/lib/format"

// Cast to loose records for construction. Values are always read straight from
// the JSON files below — nothing is invented, defaulted, or rounded here.
const healthy = healthyRaw as Record<string, any>
const f01 = fault01Raw as Record<string, any>
const f02 = fault02Raw as Record<string, any>
const f03 = fault03Raw as Record<string, any>
const f04 = fault04Raw as Record<string, any>
const f05 = fault05Raw as Record<string, any>

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
  /** Tailwind color classes for the badge (text / bg / border). */
  tone: string
  description: string
}

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  baseline: {
    id: "baseline",
    label: "Baseline",
    tone: "text-sky-300 bg-sky-500/10 border-sky-500/30",
    description: "Healthy reference operating point used for comparison.",
  },
  "operating-condition": {
    id: "operating-condition",
    label: "Operating-condition change",
    tone: "text-cyan-300 bg-cyan-500/10 border-cyan-500/30",
    description: "A change in operating conditions, not necessarily an internal fault.",
  },
  "internal-fault-proxy": {
    id: "internal-fault-proxy",
    label: "Internal-fault proxy",
    tone: "text-amber-300 bg-amber-500/10 border-amber-500/30",
    description: "A controlled proxy for an internal electrical fault. Not an inter-turn-short model.",
  },
  "supply-confounder": {
    id: "supply-confounder",
    label: "Supply-quality confounder",
    tone: "text-violet-300 bg-violet-500/10 border-violet-500/30",
    description: "A supply-side condition, not an internal motor fault.",
  },
  "vibration-signature": {
    id: "vibration-signature",
    label: "Vibration signature (simulated)",
    tone: "text-teal-300 bg-teal-500/10 border-teal-500/30",
    description: "A simulated vibration-channel signature. Electrical model unchanged.",
  },
  "proxy-fault": {
    id: "proxy-fault",
    label: "Proxy model",
    tone: "text-amber-300 bg-amber-500/10 border-amber-500/30",
    description: "A proxy for the behaviour of interest. Not a bar-resolved or calibrated model.",
  },
}

export type MetricRow = {
  label: string
  unit?: string
  /** Healthy reference value for a comparison row. */
  baseline?: number | null
  /** Condition value for a comparison row. */
  value?: number | null
  /** Single value (used when there is no healthy/condition pairing). */
  single?: number | null
  kind: "compare" | "single"
} & NumFmt

export type MetricGroup = {
  title: string
  /** Optional note shown under the group title. */
  note?: string
  rows: MetricRow[]
}

export type Check = {
  name: string
  detail: string
  value?: number | null
  unit?: string
  /** Second value for cross-checks (e.g. dynamic vs equivalent-circuit). */
  compareValue?: number | null
  compareLabel?: string
  status: "converged" | "consistent" | "reported"
} & NumFmt

export type KeyValue = { label: string; value: string }

export type Condition = {
  id: string
  title: string
  shortName: string
  category: CategoryId
  /** condition_kind field where present, verbatim. */
  conditionKind?: string
  /** The stored note / honesty statement, verbatim from the JSON. */
  scopeNote: string
  reportedQuantities: string[]
  provenance: KeyValue[]
  metricGroups: MetricGroup[]
  checks: Check[]
  /** Curated cross-condition comparison values, keyed by CURATED_METRICS id. */
  comparison: Record<string, number | null>
  raw: unknown
}

// Helpers to build metric rows without repeating boilerplate.
const cmp = (
  label: string,
  baseline: number | null | undefined,
  value: number | null | undefined,
  unit?: string,
  opts: NumFmt = {},
): MetricRow => ({
  label,
  baseline: baseline ?? null,
  value: value ?? null,
  unit,
  kind: "compare",
  ...opts,
})

const one = (
  label: string,
  single: number | null | undefined,
  unit?: string,
  opts: NumFmt = {},
): MetricRow => ({
  label,
  single: single ?? null,
  unit,
  kind: "single",
  ...opts,
})

function provenanceFrom(meta: Record<string, any>): KeyValue[] {
  return [
    { label: "Provenance", value: String(meta.provenance ?? "\u2014") },
    { label: "Parameter set", value: String(meta.parameter_name ?? "\u2014") },
    { label: "Parameter provenance", value: String(meta.parameter_provenance ?? "\u2014") },
    { label: "Scenario", value: String(meta.scenario_name ?? "\u2014") },
    { label: "Park convention", value: String(meta.park_convention ?? "\u2014") },
    { label: "Solver", value: String(meta.solver ?? "\u2014") },
    {
      label: "Supply frequency",
      value: meta.supply_frequency_hz != null ? `${meta.supply_frequency_hz} Hz` : "\u2014",
    },
    { label: "Load type", value: String(meta.load_type ?? "\u2014") },
    {
      label: "Experimental validation",
      value: meta.experimental_validation === true ? "true" : "false",
    },
  ]
}

const powerBalanceDetail =
  "Relative residual of the instantaneous power balance over the integration window."

// ---------------------------------------------------------------------------
// Healthy baseline
// ---------------------------------------------------------------------------
const healthyCondition: Condition = {
  id: "healthy",
  title: "Healthy baseline",
  shortName: "Healthy",
  category: "baseline",
  scopeNote: healthy.honesty,
  reportedQuantities: [
    "Steady-state slip and speed",
    "Electromagnetic and load torque",
    "Phase-A stator current (RMS)",
    "Equivalent-circuit cross-check",
  ],
  provenance: provenanceFrom(healthy),
  metricGroups: [
    {
      title: "Steady-state operating point",
      note: `Averaged over the steady window from t = ${healthy.steady_window_t_start_s} s.`,
      rows: [
        one("Mean slip", healthy.mean_slip, undefined, { decimals: 4 }),
        one("Mean speed", healthy.mean_speed_rpm, "rpm", { decimals: 1 }),
        one("Mean electromagnetic torque", healthy.mean_tau_e_nm, "N\u00b7m", { decimals: 3 }),
        one("Load torque", healthy.tau_l_nm, "N\u00b7m", { decimals: 1 }),
        one("Mean damping torque (B\u03c9)", healthy.mean_B_omega_nm, "N\u00b7m", { decimals: 4 }),
        one("Phase-A current (RMS)", healthy.phase_a_current_rms_a, "A", { decimals: 4 }),
      ],
    },
    {
      title: "Supply and load configuration",
      rows: [
        one("Supply frequency", healthy.supply_frequency_hz, "Hz", { decimals: 0 }),
        one("Load torque command", healthy.load_torque_nm, "N\u00b7m", { decimals: 1 }),
        one("Stator resistance (per phase)", healthy.stator_resistances_abc_ohm?.[0], "\u03a9", {
          decimals: 3,
        }),
      ],
    },
  ],
  checks: [
    {
      name: "Solver convergence",
      detail: healthy.message,
      status: "converged",
    },
    {
      name: "Power balance residual",
      detail: powerBalanceDetail,
      value: healthy.power_balance_residual_rel,
      status: "consistent",
      sci: true,
    },
    {
      name: "Torque balance",
      detail: "Net steady-state torque residual (electromagnetic \u2212 load \u2212 damping).",
      value: healthy.torque_balance_nm,
      unit: "N\u00b7m",
      status: "consistent",
      sci: true,
    },
    {
      name: "Equivalent-circuit torque cross-check",
      detail: "Dynamic mean electromagnetic torque vs steady-state equivalent-circuit torque.",
      value: healthy.mean_tau_e_nm,
      compareValue: healthy.equivalent_circuit_tau_e_nm,
      compareLabel: "Equivalent circuit",
      unit: "N\u00b7m",
      status: "consistent",
      decimals: 3,
    },
    {
      name: "Equivalent-circuit current cross-check",
      detail: "Dynamic phase-A RMS current vs steady-state equivalent-circuit current.",
      value: healthy.phase_a_current_rms_a,
      compareValue: healthy.equivalent_circuit_is_rms_a,
      compareLabel: "Equivalent circuit",
      unit: "A",
      status: "consistent",
      decimals: 4,
    },
  ],
  comparison: {
    torque_ripple_nm: null,
    current_unbalance_pct: null,
    negative_sequence_pct: null,
    final_speed_difference_rpm: null,
    final_slip_difference: null,
  },
  raw: healthyRaw,
}

// ---------------------------------------------------------------------------
// Fault 01 — stator resistance imbalance
// ---------------------------------------------------------------------------
const f01m = f01.metrics
const f01Condition: Condition = {
  id: "fault_01",
  title: "Fault 01 \u2014 stator resistance imbalance",
  shortName: "Fault 01",
  category: "internal-fault-proxy",
  scopeNote: f01.note,
  reportedQuantities: [
    "Per-phase stator current (RMS)",
    "Current unbalance",
    "Negative-sequence current",
    "Torque ripple",
    "Speed and slip difference vs healthy",
  ],
  provenance: provenanceFrom(f01.fault_metadata),
  metricGroups: [
    {
      title: "Stator resistance (per phase)",
      note: "Phase-A resistance raised by +10% relative to the balanced healthy value.",
      rows: [
        cmp(
          "Phase A",
          healthy.stator_resistances_abc_ohm?.[0],
          f01.fault_metadata?.stator_resistances_abc_ohm?.[0],
          "\u03a9",
          { decimals: 4 },
        ),
        cmp(
          "Phase B",
          healthy.stator_resistances_abc_ohm?.[1],
          f01.fault_metadata?.stator_resistances_abc_ohm?.[1],
          "\u03a9",
          { decimals: 4 },
        ),
        cmp(
          "Phase C",
          healthy.stator_resistances_abc_ohm?.[2],
          f01.fault_metadata?.stator_resistances_abc_ohm?.[2],
          "\u03a9",
          { decimals: 4 },
        ),
      ],
    },
    {
      title: "Phase current (RMS)",
      rows: [
        cmp("Phase A", f01m.phase_current_rms_healthy_a?.[0], f01m.phase_current_rms_fault_a?.[0], "A", { decimals: 4 }),
        cmp("Phase B", f01m.phase_current_rms_healthy_a?.[1], f01m.phase_current_rms_fault_a?.[1], "A", { decimals: 4 }),
        cmp("Phase C", f01m.phase_current_rms_healthy_a?.[2], f01m.phase_current_rms_fault_a?.[2], "A", { decimals: 4 }),
      ],
    },
    {
      title: "Unbalance and sequence components",
      rows: [
        cmp("Current unbalance", f01m.current_unbalance_healthy_pct, f01m.current_unbalance_fault_pct, "%", { decimals: 3 }),
        cmp("Negative-sequence current", f01m.negative_sequence_healthy_a, f01m.negative_sequence_fault_a, "A", { decimals: 4 }),
        cmp("Negative-sequence current", f01m.negative_sequence_healthy_pct, f01m.negative_sequence_fault_pct, "%", { decimals: 3 }),
      ],
    },
    {
      title: "Torque and speed",
      rows: [
        cmp("Torque ripple", f01m.torque_ripple_healthy_nm, f01m.torque_ripple_fault_nm, "N\u00b7m", { decimals: 4 }),
        one("Final speed difference vs healthy", f01m.final_speed_difference_rpm, "rpm", { decimals: 3 }),
        one("Final slip difference vs healthy", f01m.final_slip_difference, undefined, { sci: true }),
      ],
    },
  ],
  checks: [
    { name: "Solver convergence", detail: f01.fault_metadata?.message, status: "converged" },
    { name: "Power balance residual (healthy)", detail: powerBalanceDetail, value: f01.healthy_power_balance_residual_rel, status: "consistent", sci: true },
    { name: "Power balance residual (fault)", detail: powerBalanceDetail, value: f01.fault_power_balance_residual_rel, status: "consistent", sci: true },
  ],
  comparison: {
    torque_ripple_nm: f01m.torque_ripple_fault_nm,
    current_unbalance_pct: f01m.current_unbalance_fault_pct,
    negative_sequence_pct: f01m.negative_sequence_fault_pct,
    final_speed_difference_rpm: f01m.final_speed_difference_rpm,
    final_slip_difference: f01m.final_slip_difference,
  },
  raw: fault01Raw,
}

// ---------------------------------------------------------------------------
// Fault 02 — increased mechanical load (operating-condition change)
// ---------------------------------------------------------------------------
const f02Condition: Condition = {
  id: "fault_02",
  title: "Condition 02 \u2014 increased mechanical load",
  shortName: "Condition 02",
  category: "operating-condition",
  conditionKind: f02.condition_kind,
  scopeNote: f02.note,
  reportedQuantities: [
    "Load torque (baseline vs increased)",
    "Final speed and slip",
    "Late-window mean torque",
    "q-axis current (i_qs)",
  ],
  provenance: provenanceFrom(f02.condition_metadata),
  metricGroups: [
    {
      title: "Load torque",
      rows: [
        cmp("Load torque", f02.healthy_load_torque_nm, f02.condition_load_torque_nm, "N\u00b7m", { decimals: 1 }),
        one("Load increase", f02.load_increase_percent, "%", { decimals: 1 }),
      ],
    },
    {
      title: "Final speed and slip",
      rows: [
        cmp("Final speed", f02.healthy_final_speed_rpm, f02.condition_final_speed_rpm, "rpm", { decimals: 1 }),
        cmp("Final slip", f02.healthy_final_slip, f02.condition_final_slip, undefined, { decimals: 4 }),
        one("Final speed difference", f02.final_speed_difference_rpm, "rpm", { decimals: 3 }),
        one("Final slip difference", f02.final_slip_difference, undefined, { decimals: 5 }),
      ],
    },
    {
      title: "Late-window mean quantities",
      rows: [
        cmp("Mean electromagnetic torque", f02.healthy_late_mean_torque_nm, f02.condition_late_mean_torque_nm, "N\u00b7m", { decimals: 3 }),
        cmp("Mean q-axis current (i_qs)", f02.healthy_late_mean_i_qs_a, f02.condition_late_mean_i_qs_a, "A", { decimals: 4 }),
      ],
    },
  ],
  checks: [
    { name: "Solver convergence", detail: f02.condition_metadata?.message, status: "converged" },
    { name: "Power balance residual (healthy)", detail: powerBalanceDetail, value: f02.healthy_power_balance_residual_rel, status: "consistent", sci: true },
    { name: "Power balance residual (increased load)", detail: powerBalanceDetail, value: f02.condition_power_balance_residual_rel, status: "consistent", sci: true },
  ],
  comparison: {
    torque_ripple_nm: null,
    current_unbalance_pct: null,
    negative_sequence_pct: null,
    final_speed_difference_rpm: f02.final_speed_difference_rpm,
    final_slip_difference: f02.final_slip_difference,
  },
  raw: fault02Raw,
}

// ---------------------------------------------------------------------------
// Fault 03 — supply voltage unbalance (supply-quality confounder)
// ---------------------------------------------------------------------------
const f03m = f03.metrics
const f03Condition: Condition = {
  id: "fault_03",
  title: "Fault 03 \u2014 supply voltage unbalance",
  shortName: "Fault 03",
  category: "supply-confounder",
  conditionKind: f03.condition_kind,
  scopeNote: f03.note,
  reportedQuantities: [
    "Supply phase peak voltages",
    "Per-phase stator current (RMS)",
    "Current and voltage unbalance",
    "Negative-sequence current",
    "Torque ripple",
    "Speed and slip difference vs healthy",
  ],
  provenance: provenanceFrom(f03.fault_metadata),
  metricGroups: [
    {
      title: "Supply phase peak voltage",
      note: "Phase C reduced to 0.9 p.u. (controlled supply unbalance).",
      rows: [
        cmp("Phase A", healthy.supply_phase_peak_abc_v?.[0], f03.supply_phase_peak_abc_v?.[0], "V", { decimals: 1 }),
        cmp("Phase B", healthy.supply_phase_peak_abc_v?.[1], f03.supply_phase_peak_abc_v?.[1], "V", { decimals: 1 }),
        cmp("Phase C", healthy.supply_phase_peak_abc_v?.[2], f03.supply_phase_peak_abc_v?.[2], "V", { decimals: 1 }),
      ],
    },
    {
      title: "Phase current (RMS)",
      rows: [
        cmp("Phase A", f03m.phase_current_rms_healthy_a?.[0], f03m.phase_current_rms_unbalance_a?.[0], "A", { decimals: 4 }),
        cmp("Phase B", f03m.phase_current_rms_healthy_a?.[1], f03m.phase_current_rms_unbalance_a?.[1], "A", { decimals: 4 }),
        cmp("Phase C", f03m.phase_current_rms_healthy_a?.[2], f03m.phase_current_rms_unbalance_a?.[2], "A", { decimals: 4 }),
      ],
    },
    {
      title: "Unbalance and sequence components",
      rows: [
        cmp("Supply voltage unbalance", f03m.supply_voltage_unbalance_healthy_pct, f03m.supply_voltage_unbalance_unbalance_pct, "%", { decimals: 3 }),
        cmp("Current unbalance", f03m.current_unbalance_healthy_pct, f03m.current_unbalance_unbalance_pct, "%", { decimals: 3 }),
        cmp("Negative-sequence current", f03m.negative_sequence_healthy_a, f03m.negative_sequence_unbalance_a, "A", { decimals: 4 }),
        cmp("Negative-sequence current", f03m.negative_sequence_healthy_pct, f03m.negative_sequence_unbalance_pct, "%", { decimals: 3 }),
      ],
    },
    {
      title: "Torque and speed",
      rows: [
        cmp("Torque ripple", f03m.torque_ripple_healthy_nm, f03m.torque_ripple_unbalance_nm, "N\u00b7m", { decimals: 4 }),
        one("Final speed difference vs healthy", f03m.final_speed_difference_rpm, "rpm", { decimals: 3 }),
        one("Final slip difference vs healthy", f03m.final_slip_difference, undefined, { decimals: 5 }),
      ],
    },
  ],
  checks: [
    { name: "Solver convergence", detail: f03.fault_metadata?.message, status: "converged" },
    { name: "Power balance residual (healthy)", detail: powerBalanceDetail, value: f03.healthy_power_balance_residual_rel, status: "consistent", sci: true },
    { name: "Power balance residual (unbalance)", detail: powerBalanceDetail, value: f03.fault_power_balance_residual_rel, status: "consistent", sci: true },
  ],
  comparison: {
    torque_ripple_nm: f03m.torque_ripple_unbalance_nm,
    current_unbalance_pct: f03m.current_unbalance_unbalance_pct,
    negative_sequence_pct: f03m.negative_sequence_unbalance_pct,
    final_speed_difference_rpm: f03m.final_speed_difference_rpm,
    final_slip_difference: f03m.final_slip_difference,
  },
  raw: fault03Raw,
}

// ---------------------------------------------------------------------------
// Fault 04 — bearing outer-race vibration signature
// ---------------------------------------------------------------------------
const f04m = f04.metrics
const f04cfg = f04.bearing_config
const f04Condition: Condition = {
  id: "fault_04",
  title: "Fault 04 \u2014 bearing outer-race vibration signature",
  shortName: "Fault 04",
  category: "vibration-signature",
  conditionKind: f04.condition_kind,
  scopeNote: f04.note,
  reportedQuantities: [
    "Bearing geometry (literature-example 6205-series)",
    "BPFO characteristic frequency",
    "Envelope amplitude at BPFO and 2\u00d7BPFO",
    "Simulated vibration channel only \u2014 electrical traces unchanged",
  ],
  provenance: provenanceFrom(f04.fault_metadata),
  metricGroups: [
    {
      title: "Bearing geometry (literature example, 6205-series)",
      rows: [
        one("Number of balls", f04cfg.nb_balls, undefined, { decimals: 0 }),
        one("Ball diameter", f04cfg.ball_diameter_m, "m", { decimals: 5 }),
        one("Pitch diameter", f04cfg.pitch_diameter_m, "m", { decimals: 5 }),
        one("Contact angle", f04cfg.contact_angle_deg, "deg", { decimals: 1 }),
        one("Resonance frequency", f04cfg.resonance_hz, "Hz", { decimals: 0 }),
        one("Resonance decay", f04cfg.resonance_decay_s, "s", { sci: true }),
        one("Impulse amplitude", f04cfg.amplitude_m_s2, "m/s\u00b2", { decimals: 2 }),
      ],
    },
    {
      title: "Characteristic frequencies",
      rows: [
        one("BPFO (outer-race)", f04m.bpfo_hz, "Hz", { decimals: 2 }),
        one("Mean shaft frequency", f04m.shaft_hz_mean, "Hz", { decimals: 2 }),
      ],
    },
    {
      title: "Envelope amplitude (simulated vibration channel)",
      note: "Healthy vibration channel has no bearing-fault modulation, so healthy envelope amplitudes are 0.",
      rows: [
        cmp("Envelope at BPFO", f04m.envelope_bpfo_healthy, f04m.envelope_bpfo_fault, undefined, { decimals: 4 }),
        cmp("Envelope at 2\u00d7BPFO", f04m.envelope_bpfo_2x_healthy, f04m.envelope_bpfo_2x_fault, undefined, { decimals: 4 }),
        cmp("Envelope peak frequency", f04m.bpfo_peak_healthy_hz, f04m.bpfo_peak_fault_hz, "Hz", { decimals: 2 }),
        one("Envelope BPFO ratio", f04m.envelope_bpfo_ratio, undefined, { decimals: 3 }),
      ],
    },
  ],
  checks: [
    { name: "Solver convergence", detail: f04.fault_metadata?.message, status: "converged" },
    { name: "Power balance residual (healthy)", detail: powerBalanceDetail, value: f04.healthy_power_balance_residual_rel, status: "consistent", sci: true },
    { name: "Power balance residual (fault)", detail: powerBalanceDetail, value: f04.fault_power_balance_residual_rel, status: "consistent", sci: true },
  ],
  comparison: {
    torque_ripple_nm: null,
    current_unbalance_pct: null,
    negative_sequence_pct: null,
    final_speed_difference_rpm: null,
    final_slip_difference: null,
  },
  raw: fault04Raw,
}

// ---------------------------------------------------------------------------
// Fault 05 — rotor electrical asymmetry proxy
// ---------------------------------------------------------------------------
const f05m = f05.metrics
const f05cfg = f05.rotor_asymmetry_config
const f05Condition: Condition = {
  id: "fault_05",
  title: "Fault 05 \u2014 rotor electrical asymmetry proxy",
  shortName: "Fault 05",
  category: "proxy-fault",
  conditionKind: f05.condition_kind,
  scopeNote: f05.note,
  reportedQuantities: [
    "Fundamental and sideband frequencies",
    "Lower/upper sideband current amplitudes",
    "Synchronous modulation amplitude",
    "Torque ripple",
    "Speed and slip difference vs healthy",
  ],
  provenance: provenanceFrom(f05.fault_metadata),
  metricGroups: [
    {
      title: "Asymmetry configuration",
      rows: [
        one("Severity (fraction)", f05cfg.severity, undefined, { decimals: 2 }),
        one("Reference slip", f05cfg.reference_slip, undefined, { decimals: 5 }),
        one("Initial phase", f05cfg.initial_phase_deg, "deg", { decimals: 1 }),
      ],
    },
    {
      title: "Characteristic frequencies",
      rows: [
        one("Fundamental", f05m.fundamental_hz, "Hz", { decimals: 1 }),
        one("Modulation frequency", f05m.modulation_frequency_hz, "Hz", { decimals: 3 }),
        one("Lower sideband", f05m.lower_sideband_hz, "Hz", { decimals: 3 }),
        one("Upper sideband", f05m.upper_sideband_hz, "Hz", { decimals: 3 }),
        one("Sideband half-width", f05m.sideband_half_width_hz, "Hz", { decimals: 1 }),
      ],
    },
    {
      title: "Current amplitudes",
      rows: [
        cmp("Phase-A fundamental", f05m.phase_a_fundamental_healthy_a, f05m.phase_a_fundamental_fault_a, "A", { decimals: 4 }),
        cmp("Lower sideband", f05m.lower_sideband_healthy_a, f05m.lower_sideband_fault_a, "A", { decimals: 4 }),
        cmp("Upper sideband", f05m.upper_sideband_healthy_a, f05m.upper_sideband_fault_a, "A", { decimals: 4 }),
        cmp("Synchronous modulation", f05m.sync_modulation_healthy_a, f05m.sync_modulation_fault_a, "A", { sci: true }),
      ],
    },
    {
      title: "Torque and speed",
      rows: [
        cmp("Torque ripple", f05m.torque_ripple_healthy_nm, f05m.torque_ripple_fault_nm, "N\u00b7m", { sci: true }),
        one("Final speed difference vs healthy", f05m.final_speed_difference_rpm, "rpm", { decimals: 3 }),
        one("Final slip difference vs healthy", f05m.final_slip_difference, undefined, { decimals: 5 }),
      ],
    },
  ],
  checks: [
    { name: "Solver convergence", detail: f05.fault_metadata?.message, status: "converged" },
    { name: "Power balance residual (healthy)", detail: powerBalanceDetail, value: f05.healthy_power_balance_residual_rel, status: "consistent", sci: true },
    { name: "Power balance residual (fault)", detail: powerBalanceDetail, value: f05.fault_power_balance_residual_rel, status: "consistent", sci: true },
  ],
  comparison: {
    torque_ripple_nm: f05m.torque_ripple_fault_nm,
    current_unbalance_pct: null,
    negative_sequence_pct: null,
    final_speed_difference_rpm: f05m.final_speed_difference_rpm,
    final_slip_difference: f05m.final_slip_difference,
  },
  raw: fault05Raw,
}

export const conditions: Condition[] = [
  healthyCondition,
  f02Condition,
  f01Condition,
  f03Condition,
  f04Condition,
  f05Condition,
]

export function getCondition(id: string): Condition | undefined {
  return conditions.find((c) => c.id === id)
}

// Curated cross-condition metrics. Only metrics that are reported for more than
// one condition are eligible for the comparison bar charts.
export type CuratedMetric = {
  id: string
  label: string
  unit?: string
  description: string
} & NumFmt

export const CURATED_METRICS: CuratedMetric[] = [
  {
    id: "torque_ripple_nm",
    label: "Torque ripple",
    unit: "N\u00b7m",
    decimals: 4,
    description: "Peak-to-peak style electromagnetic torque ripple reported for the condition.",
  },
  {
    id: "current_unbalance_pct",
    label: "Current unbalance",
    unit: "%",
    decimals: 3,
    description: "Stator current unbalance reported for the condition.",
  },
  {
    id: "negative_sequence_pct",
    label: "Negative-sequence current",
    unit: "%",
    decimals: 3,
    description: "Negative-sequence stator current as a percentage.",
  },
  {
    id: "final_speed_difference_rpm",
    label: "Final speed difference vs healthy",
    unit: "rpm",
    decimals: 3,
    description: "Difference between the condition and healthy final rotor speed.",
  },
  {
    id: "final_slip_difference",
    label: "Final slip difference vs healthy",
    decimals: 5,
    description: "Difference between the condition and healthy final slip.",
  },
]

/** Condition-specific metrics reported for only one condition (never cross-plotted). */
export type SpecificMetric = { conditionId: string; label: string; value: number | null; unit?: string } & NumFmt

export const CONDITION_SPECIFIC_METRICS: SpecificMetric[] = [
  { conditionId: "fault_02", label: "Load increase", value: f02.load_increase_percent, unit: "%", decimals: 1 },
  { conditionId: "fault_03", label: "Supply voltage unbalance", value: f03m.supply_voltage_unbalance_unbalance_pct, unit: "%", decimals: 3 },
  { conditionId: "fault_04", label: "BPFO (outer-race)", value: f04m.bpfo_hz, unit: "Hz", decimals: 2 },
  { conditionId: "fault_04", label: "Envelope at BPFO", value: f04m.envelope_bpfo_fault, decimals: 4 },
  { conditionId: "fault_05", label: "Modulation frequency", value: f05m.modulation_frequency_hz, unit: "Hz", decimals: 3 },
  { conditionId: "fault_05", label: "Lower sideband current", value: f05m.lower_sideband_fault_a, unit: "A", decimals: 4 },
  { conditionId: "fault_05", label: "Upper sideband current", value: f05m.upper_sideband_fault_a, unit: "A", decimals: 4 },
]

// Consistent color per condition for the comparison charts.
export const CONDITION_COLORS: Record<string, string> = {
  healthy: "var(--chart-2)",
  fault_01: "var(--chart-1)",
  fault_02: "var(--chart-3)",
  fault_03: "var(--chart-5)",
  fault_04: "var(--chart-4)",
  fault_05: "var(--color-amber-400, oklch(0.82 0.15 85))",
}

export const PROJECT = {
  title: "Induction Motor Condition Monitoring",
  scope:
    "A software-only, physics-based reduced-order simulation of induction motor condition monitoring. All traces are simulated with literature-example parameters. This dashboard reports stored results only; it does not diagnose a physical machine.",
  parameterSet: healthy.parameter_name as string,
  parameterNotes: healthy.parameter_notes as string,
  honesty: healthy.honesty as string,
}
