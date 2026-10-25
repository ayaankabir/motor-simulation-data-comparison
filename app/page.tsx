"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { api, simulate } from "@/lib/api"
import { conditions, setConditions } from "@/lib/conditions"
import { BarChart3, BrainCircuit, CircuitBoard, Compass, FlaskConical, Gauge, Info, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Overview } from "@/components/dashboard/overview"
import { Explorer } from "@/components/dashboard/explorer"
import { Comparison } from "@/components/dashboard/comparison"
import { Validation } from "@/components/dashboard/validation"
import { About } from "@/components/dashboard/about"
import { SimulationLab } from "@/components/dashboard/simulation-lab"
import MLAnalysisPage from "@/app/ml-analysis/page"

type SectionId = "overview" | "explorer" | "comparison" | "validation" | "about" | "simulation" | "ml-analysis"

const NAV_GROUPS: { label: string; items: { id: SectionId; label: string; icon: typeof Gauge }[] }[] = [
  {
    label: "Monitoring",
    items: [
      { id: "overview", label: "Overview", icon: Gauge },
      { id: "explorer", label: "Condition Explorer", icon: Compass },
      { id: "comparison", label: "Comparison", icon: BarChart3 },
    ],
  },
  {
    label: "Engineering",
    items: [
      { id: "simulation", label: "Simulation Lab", icon: CircuitBoard },
      { id: "ml-analysis", label: "ML Analysis", icon: BrainCircuit },
      { id: "validation", label: "Consistency Checks", icon: ShieldCheck },
    ],
  },
  {
    label: "Information",
    items: [{ id: "about", label: "About", icon: Info }],
  },
]

export default function Page() {
  const [section, setSection] = useState<SectionId>("overview")
  const [conditionId, setConditionId] = useState<string>("healthy")
  // The conditions store is a module-level singleton mutated in place by
  // setConditions (splice). Bumping this counter forces the re-render that the
  // in-place mutation cannot trigger on its own, so data appears on first load.
  const [, setStoreVersion] = useState(0)
  const { data, error, isLoading } = useSWR("conditions", api.conditions)

  useEffect(() => {
    if (data) {
      setConditions(data)
      setStoreVersion((version) => version + 1)
    }
  }, [data])

  if (isLoading) return <StatusState title="Loading simulation results" detail="Connecting to the read-only FastAPI service at NEXT_PUBLIC_API_BASE_URL." />
  if (error) return <StatusState title="API not connected" detail={error.message} error />
  if (!data?.length) return <StatusState title="No condition data reported" detail="The API returned no condition records. Start the FastAPI service and verify its read-only results endpoint." />

  function goToCondition(id: string) {
    setConditionId(id)
    setSection("explorer")
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex items-center gap-3 border-b border-border/80 px-4 py-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
            <CircuitBoard className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground">Motor CM</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">Simulation dashboard</p>
          </div>
        </div>
        <nav aria-label="Primary navigation" className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {NAV_GROUPS.map((group) => (
              <section key={group.label} aria-label={`${group.label} navigation`}>
                <h2 className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                  {group.label}
                </h2>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavButton
                      key={item.id}
                      active={section === item.id}
                      onClick={() => setSection(item.id)}
                      icon={item.icon}
                      label={item.label}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </nav>
        <div className="border-t border-border px-3 py-3">
          <div className="flex items-start gap-2 rounded-lg bg-muted/20 px-2.5 py-2">
            <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <p className="text-[11px] leading-4 text-muted-foreground">
              Simulation only. Literature-example parameters. No experimental validation.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2.5 border-b border-border bg-sidebar px-4 py-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <CircuitBoard className="size-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground">Motor CM</p>
            <p className="truncate text-[11px] text-muted-foreground">Simulation dashboard</p>
          </div>
        </div>
        <nav aria-label="Primary navigation" className="flex min-w-0 gap-4 overflow-x-auto border-b border-border bg-background/80 px-3 py-2.5">
          {NAV_GROUPS.map((group) => (
            <section key={group.label} className="flex shrink-0 flex-col gap-1.5">
              <h2 className="px-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                {group.label}
              </h2>
              <div className="flex gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = section === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSection(item.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="size-3.5 shrink-0" aria-hidden />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <main className="min-w-0">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          {section === "overview" && <Overview onSelect={goToCondition} />}
          {section === "explorer" && <Explorer activeId={conditionId} onChange={setConditionId} />}
          {section === "comparison" && <Comparison />}
          {section === "validation" && <Validation />}
          {section === "about" && <About />}
          {section === "simulation" && <SimulationLab />}
          {section === "ml-analysis" && <MLAnalysisPage />}
        </div>
      </main>
    </div>
  )
}

function StatusState({ title, detail, error = false }: { title: string; detail: string; error?: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="max-w-lg rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className={cn("text-xs font-semibold uppercase tracking-wide", error ? "text-amber-300" : "text-primary")}>Read-only API</p>
        <h1 className="mt-2 text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
        <p className="mt-4 text-xs text-muted-foreground">Configure NEXT_PUBLIC_API_BASE_URL; this frontend does not run simulations or use bundled demo data.</p>
      </section>
    </main>
  )
}

function NavButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Gauge
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        active
          ? "bg-primary/15 text-primary shadow-sm ring-1 ring-inset ring-primary/15"
          : "text-muted-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {label}
    </button>
  )
}
