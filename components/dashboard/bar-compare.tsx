import { fmt, DASH } from "@/lib/format"
import type { CuratedMetric } from "@/lib/conditions"
import { CONDITION_COLORS } from "@/lib/conditions"
import { Panel } from "@/components/dashboard/ui"

export type BarDatum = {
  id: string
  label: string
  value: number | null
}

export function BarCompare({ metric, data }: { metric: CuratedMetric; data: BarDatum[] }) {
  const reported = data.filter((d) => d.value !== null && d.value !== undefined) as {
    id: string
    label: string
    value: number
  }[]
  const missing = data.filter((d) => d.value === null || d.value === undefined)

  const opts = { decimals: metric.decimals, sci: metric.sci }

  // Only chart metrics that at least two conditions report.
  if (reported.length < 2) {
    return (
      <Panel className="p-4">
        <MetricHeader metric={metric} />
        <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            {reported.length === 0
              ? "Not reported for any condition in this comparison."
              : `Reported for only one condition (${reported[0].label}). A bar chart across conditions is not shown for single-condition metrics.`}
          </p>
          {reported.length === 1 ? (
            <p className="mt-2 font-mono text-sm text-foreground">
              {reported[0].label}: {fmt(reported[0].value, opts)}
              {metric.unit ? ` ${metric.unit}` : ""}
            </p>
          ) : null}
        </div>
      </Panel>
    )
  }

  const maxAbs = Math.max(...reported.map((d) => Math.abs(d.value)))
  const hasNegative = reported.some((d) => d.value < 0)

  return (
    <Panel className="p-4">
      <MetricHeader metric={metric} />
      <ul className="mt-4 space-y-3">
        {data.map((d) => {
          const has = d.value !== null && d.value !== undefined
          const v = has ? (d.value as number) : 0
          const pct = maxAbs === 0 ? 0 : (Math.abs(v) / maxAbs) * (hasNegative ? 50 : 100)
          const color = CONDITION_COLORS[d.id] ?? "var(--chart-1)"
          return (
            <li key={d.id} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3">
              <span className="truncate text-xs text-muted-foreground" title={d.label}>
                {d.label}
              </span>
              <div className="relative h-5 rounded bg-muted/50">
                {hasNegative ? (
                  <span className="absolute inset-y-0 left-1/2 w-px bg-border" aria-hidden />
                ) : null}
                {has ? (
                  <span
                    className="absolute inset-y-0.5 rounded"
                    style={
                      hasNegative
                        ? v >= 0
                          ? { left: "50%", width: `${pct}%`, backgroundColor: color }
                          : { right: "50%", width: `${pct}%`, backgroundColor: color }
                        : { left: 0, width: `${pct}%`, backgroundColor: color }
                    }
                    aria-hidden
                  />
                ) : null}
              </div>
              <span
                className={
                  "w-24 text-right font-mono text-xs tabular-nums " +
                  (has ? "text-foreground" : "text-muted-foreground")
                }
              >
                {has ? fmt(v, opts) : DASH}
              </span>
            </li>
          )
        })}
      </ul>
      {missing.length ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Not reported for: {missing.map((m) => m.label).join(", ")}.
        </p>
      ) : null}
    </Panel>
  )
}

function MetricHeader({ metric }: { metric: CuratedMetric }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{metric.label}</h3>
        {metric.unit ? (
          <span className="font-mono text-xs text-muted-foreground">{metric.unit}</span>
        ) : null}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{metric.description}</p>
    </div>
  )
}
