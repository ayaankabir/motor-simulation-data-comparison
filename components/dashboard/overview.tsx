import { ArrowRight, FlaskConical } from "lucide-react"
import { conditions, CATEGORIES, PROJECT } from "@/lib/conditions"
import { CategoryBadge, Panel, SectionHeading } from "@/components/dashboard/ui"

export function Overview({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Condition monitoring"
        title={PROJECT.title}
        description={PROJECT.scope}
      />

      <ScopeBanner />

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Conditions ({conditions.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {conditions.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className="group flex flex-col rounded-xl border border-border bg-card/60 p-5 text-left transition-colors hover:border-primary/50 hover:bg-card"
            >
              <div className="flex items-start justify-between gap-2">
                <CategoryBadge category={c.category} />
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
              </div>
              <h3 className="mt-3 text-base font-semibold text-foreground">{c.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {c.scopeNote}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.reportedQuantities.slice(0, 3).map((q) => (
                  <span
                    key={q}
                    className="rounded border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {q}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Category legend
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.values(CATEGORIES).map((cat) => (
            <Panel key={cat.id} className="flex items-start gap-3 p-4">
              <CategoryBadge category={cat.id} />
              <p className="text-sm text-muted-foreground">{cat.description}</p>
            </Panel>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScopeBanner() {
  return (
    <Panel className="flex items-start gap-3 border-sky-500/25 bg-sky-500/[0.06] p-4">
      <FlaskConical className="mt-0.5 size-5 shrink-0 text-sky-300" aria-hidden />
      <div className="space-y-1 text-sm">
        <p className="font-medium text-foreground">Simulation only — no experimental validation</p>
        <p className="text-muted-foreground">
          {PROJECT.honesty}
        </p>
        <p className="text-muted-foreground">
          Parameter set: <span className="font-mono text-foreground">{PROJECT.parameterSet}</span>. {PROJECT.parameterNotes}
        </p>
      </div>
    </Panel>
  )
}
