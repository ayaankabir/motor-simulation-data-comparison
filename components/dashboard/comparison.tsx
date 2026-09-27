import {
  conditions,
  CURATED_METRICS,
  CONDITION_SPECIFIC_METRICS,
  getCondition,
} from "@/lib/conditions"
import { fmt } from "@/lib/format"
import { BarCompare, type BarDatum } from "@/components/dashboard/bar-compare"
import { Panel, SectionHeading } from "@/components/dashboard/ui"

export function Comparison() {
  // Healthy is the reference baseline and does not report the comparison metrics,
  // so the cross-condition charts cover the five non-baseline conditions.
  // Read the store inside render: `conditions` is a module-level singleton that
  // setConditions() mutates in place once the API resolves, so a module-scope
  // filter would capture the empty initial array and chart nothing.
  const comparedConditions = conditions.filter((c) => c.id !== "healthy")
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Cross-condition comparison"
        title="Compare metrics across conditions"
        description="Only metrics reported by at least two conditions are charted. A metric reported for a single condition is shown as a value, not a bar chart, so nothing is implied by an absent comparison."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {CURATED_METRICS.map((metric) => {
          const data: BarDatum[] = comparedConditions.map((c) => ({
            id: c.id,
            label: c.shortName,
            value: c.comparison[metric.id] ?? null,
          }))
          return <BarCompare key={metric.id} metric={metric} data={data} />
        })}
      </div>

      <div>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Diagnostic Discrimination Matrix
        </h2>
        <p className="mb-3 max-w-3xl text-sm text-muted-foreground">
          Scientific reasoning for multi-channel condition separation based on stored ODE simulation metrics.
          Produced deterministically by the backend explanation layer without machine learning or probabilistic classification.
        </p>
        <Panel className="overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted-foreground bg-muted/30">
                  <th className="px-4 py-2.5 text-left font-medium">Condition</th>
                  <th className="px-4 py-2.5 text-left font-medium">Classification</th>
                  <th className="px-4 py-2.5 text-left font-medium">Primary Discriminant Signature</th>
                  <th className="px-4 py-2.5 text-left font-medium">Key Confounder Distinction</th>
                </tr>
              </thead>
              <tbody>
                {comparedConditions.map((c) => (
                  <tr key={c.id} className="border-t border-border/60">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                      {c.shortName}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {c.explanation?.classification_label ?? c.category}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-foreground/90">
                      {c.explanation?.why_classified ?? "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {c.explanation?.discrimination_vs_confounders?.[0] ?? "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Condition-specific metrics
        </h2>
        <p className="mb-3 max-w-3xl text-sm text-muted-foreground">
          These quantities are reported for only one condition each. They are shown here as values
          because a cross-condition comparison would not be meaningful.
        </p>
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium">Condition</th>
                  <th className="px-4 py-2 text-left font-medium">Metric</th>
                  <th className="px-4 py-2 text-right font-medium">Value</th>
                  <th className="w-16 px-4 py-2 text-left font-medium">Unit</th>
                </tr>
              </thead>
              <tbody>
                {CONDITION_SPECIFIC_METRICS.map((m, i) => {
                  const c = getCondition(m.conditionId)
                  return (
                    <tr key={i} className="border-t border-border/60">
                      <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                        {c?.shortName ?? m.conditionId}
                      </td>
                      <td className="px-4 py-2.5 text-foreground">{m.label}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                        {fmt(m.value, { decimals: m.decimals, sci: m.sci })}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                        {m.unit ?? "\u2014"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  )
}
