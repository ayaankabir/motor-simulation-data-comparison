"use client"

import { ChevronDown } from "lucide-react"
import { conditions, getCondition } from "@/lib/conditions"
import { CategoryBadge, Panel, SectionHeading } from "@/components/dashboard/ui"
import { MetricGroupTable } from "@/components/dashboard/metric-table"
import { RawJson } from "@/components/dashboard/raw-json"

export function Explorer({
  activeId,
  onChange,
}: {
  activeId: string
  onChange: (id: string) => void
}) {
  const condition = getCondition(activeId) ?? conditions[0]

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Condition explorer"
        title="Explore a single condition"
        description="Every value shown is read directly from the stored result file for the selected condition. Missing quantities are shown as an em-dash rather than filled with a default."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative inline-flex w-full max-w-sm items-center">
          <span className="sr-only">Select condition</span>
          <select
            value={condition.id}
            onChange={(e) => onChange(e.target.value)}
            className="w-full appearance-none rounded-lg border border-border bg-card px-4 py-2.5 pr-10 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {conditions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted-foreground" aria-hidden />
        </label>
        <CategoryBadge category={condition.category} />
      </div>

      <Panel className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">{condition.title}</h2>
          {condition.conditionKind ? (
            <span className="rounded border border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              {condition.conditionKind}
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{condition.scopeNote}</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {condition.reportedQuantities.map((q) => (
            <span
              key={q}
              className="rounded border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {q}
            </span>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        {condition.metricGroups.map((g) => (
          <MetricGroupTable key={g.title} group={g} />
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Provenance</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Source and parameter metadata recorded when the result file was generated.
          </p>
        </div>
        <dl className="grid gap-x-6 gap-y-0 sm:grid-cols-2">
          {condition.provenance.map((kv, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-4 border-t border-border/60 px-4 py-2.5 text-sm first:border-t-0 sm:[&:nth-child(2)]:border-t-0"
            >
              <dt className="text-muted-foreground">{kv.label}</dt>
              <dd className="text-right font-mono text-xs text-foreground">{kv.value}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <RawJson data={condition.raw} />
    </div>
  )
}
