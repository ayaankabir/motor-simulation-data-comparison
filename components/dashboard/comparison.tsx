import {
  conditions,
  CURATED_METRICS,
  CONDITION_SPECIFIC_METRICS,
  getCondition,
} from "@/lib/conditions"
import { fmt } from "@/lib/format"
import { BarCompare, type BarDatum } from "@/components/dashboard/bar-compare"
import { Panel, SectionHeading } from "@/components/dashboard/ui"

// Healthy is the reference baseline and does not report the comparison metrics,
// so the cross-condition charts cover the five non-baseline conditions.
const comparedConditions = conditions.filter((c) => c.id !== "healthy")

export function Comparison() {
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
