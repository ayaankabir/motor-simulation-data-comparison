"use client"

import type { ConditionExplanation, DiagnosticRole, MetricEvidence } from "@/lib/types"
import { Panel } from "@/components/dashboard/ui"
import { fmt } from "@/lib/format"

const ROLE_LABELS: Record<DiagnosticRole, { label: string; badgeClass: string }> = {
  primary_discriminant: {
    label: "Primary Discriminant",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  confounder_check: {
    label: "Confounder Check",
    badgeClass: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  },
  normal_baseline: {
    label: "Baseline Reference",
    badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  },
  unaffected_channel: {
    label: "Unaffected Channel",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
}

function formatEvidenceValue(val: number | string | null, unit?: string | null): string {
  if (val === null || val === undefined) return "\u2014"
  if (typeof val === "number") {
    const formatted = fmt(val, { decimals: 4 })
    return unit ? `${formatted} ${unit}` : formatted
  }
  return unit ? `${val} ${unit}` : String(val)
}

export function ExplanationPanel({ explanation }: { explanation?: ConditionExplanation }) {
  if (!explanation) return null

  return (
    <Panel className="space-y-6 p-6">
      <div className="border-b border-border/60 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground">Diagnostic Explanation & Reasoning</h3>
          <span className="rounded border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
            {explanation.classification_label}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {explanation.why_classified}
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Physical Mechanism / Model Representation
        </h4>
        <p className="rounded-lg border border-border/50 bg-muted/20 p-3 font-mono text-xs leading-relaxed text-foreground/90">
          {explanation.physical_mechanism}
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Supporting Signal Evidence & Feature Roles
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {explanation.supporting_evidence.map((ev: MetricEvidence, idx: number) => {
            const roleInfo = ROLE_LABELS[ev.diagnostic_role] ?? {
              label: ev.diagnostic_role,
              badgeClass: "bg-muted text-muted-foreground border-border",
            }
            return (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-lg border border-border/60 bg-card/60 p-3.5 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-medium text-foreground">
                    {ev.metric_name}
                  </span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${roleInfo.badgeClass}`}
                  >
                    {roleInfo.label}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">Observed:</span>
                  <span className="font-mono font-medium text-foreground">
                    {formatEvidenceValue(ev.observed_value, ev.unit)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs border-b border-border/40 pb-2">
                  <span className="text-muted-foreground">Baseline:</span>
                  <span className="font-mono text-muted-foreground">
                    {formatEvidenceValue(ev.baseline_value, ev.unit)}
                  </span>
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground pt-1">
                  {ev.interpretation}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {explanation.discrimination_vs_confounders.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cross-Condition Discrimination & Confounder Handling
          </h4>
          <ul className="list-inside list-disc space-y-1.5 rounded-lg border border-border/50 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
            {explanation.discrimination_vs_confounders.map((disc: string, idx: number) => (
              <li key={idx} className="text-foreground/90">
                {disc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {explanation.standing_limitations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Scientific Limitations & Honesty Scope
          </h4>
          <ul className="list-inside list-disc space-y-1.5 rounded-lg border border-border/50 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
            {explanation.standing_limitations.map((lim: string, idx: number) => (
              <li key={idx}>
                {lim}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}
