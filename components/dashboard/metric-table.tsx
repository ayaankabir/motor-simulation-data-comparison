import { fmt, DASH } from "@/lib/format"
import type { MetricGroup } from "@/lib/conditions"
import { Panel } from "@/components/dashboard/ui"

function ValueCell({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <td
      className={
        "whitespace-nowrap px-4 py-2.5 text-right font-mono text-sm tabular-nums " +
        (muted ? "text-muted-foreground" : "text-foreground")
      }
    >
      {children}
    </td>
  )
}

export function MetricGroupTable({ group }: { group: MetricGroup }) {
  const isCompare = group.rows.some((r) => r.kind === "compare")

  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
        {group.note ? <p className="mt-0.5 text-xs text-muted-foreground">{group.note}</p> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Metric</th>
              {isCompare ? (
                <>
                  <th className="px-4 py-2 text-right font-medium">Healthy</th>
                  <th className="px-4 py-2 text-right font-medium">Condition</th>
                </>
              ) : (
                <th className="px-4 py-2 text-right font-medium">Value</th>
              )}
              <th className="w-16 px-4 py-2 text-left font-medium">Unit</th>
            </tr>
          </thead>
          <tbody>
            {group.rows.map((row, i) => {
              const opts = { decimals: row.decimals, sci: row.sci }
              return (
                <tr key={i} className="border-t border-border/60">
                  <td className="px-4 py-2.5 text-left text-foreground">{row.label}</td>
                  {row.kind === "compare" ? (
                    <>
                      <ValueCell muted>{fmt(row.baseline, opts)}</ValueCell>
                      <ValueCell>{fmt(row.value, opts)}</ValueCell>
                    </>
                  ) : (
                    <ValueCell>{fmt(row.single, opts)}</ValueCell>
                  )}
                  <td className="px-4 py-2.5 text-left font-mono text-xs text-muted-foreground">
                    {row.unit ?? DASH}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
