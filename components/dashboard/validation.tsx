import { CheckCircle2, Info, ShieldCheck } from "lucide-react"
import { conditions } from "@/lib/conditions"
import { fmt, DASH } from "@/lib/format"
import { CategoryBadge, Panel, SectionHeading, Tag } from "@/components/dashboard/ui"

function statusTag(status: string) {
  if (status === "converged")
    return (
      <Tag tone="ok">
        <CheckCircle2 className="size-3" aria-hidden /> Converged
      </Tag>
    )
  if (status === "consistent")
    return (
      <Tag tone="ok">
        <CheckCircle2 className="size-3" aria-hidden /> Consistent
      </Tag>
    )
  return <Tag tone="info">Reported</Tag>
}

export function Validation() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Consistency checks"
        title="Stored numerical consistency checks"
        description="Each result file stores the self-consistency checks that were computed when it was generated. This dashboard displays those stored values; it does not re-run the simulation or the checks."
      />

      <Panel className="flex items-start gap-3 border-amber-500/25 bg-amber-500/[0.06] p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-amber-300" aria-hidden />
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">How to read these checks</p>
          <p className="text-muted-foreground">
            Status tags are a display-side reading of the stored values: &quot;Converged&quot; is taken
            from the solver message, and &quot;Consistent&quot; indicates a residual or cross-check that
            agrees to within numerical tolerance. These are numerical self-consistency indicators of the
            simulation, <span className="text-foreground">not</span> experimental validation against a
            physical machine.
          </p>
        </div>
      </Panel>

      <div className="space-y-5">
        {conditions.map((c) => (
          <Panel key={c.id} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" aria-hidden />
                <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
              </div>
              <CategoryBadge category={c.category} />
            </div>
            <ul className="divide-y divide-border/60">
              {c.checks.map((check, i) => (
                <li key={i} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{check.name}</span>
                      {statusTag(check.status)}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{check.detail}</p>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    {check.value !== undefined ? (
                      <p className="font-mono text-sm tabular-nums text-foreground">
                        {fmt(check.value, { decimals: check.decimals, sci: check.sci })}
                        {check.unit ? <span className="text-muted-foreground"> {check.unit}</span> : null}
                      </p>
                    ) : (
                      <p className="font-mono text-sm text-muted-foreground">{DASH}</p>
                    )}
                    {check.compareValue !== undefined && check.compareValue !== null ? (
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {check.compareLabel}: {fmt(check.compareValue, { decimals: check.decimals, sci: check.sci })}
                        {check.unit ? ` ${check.unit}` : ""}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </div>
  )
}
