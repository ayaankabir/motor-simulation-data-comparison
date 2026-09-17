"use client"

import { useState } from "react"
import { BarChart3, CircuitBoard, Compass, Gauge, Info, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { PROJECT } from "@/lib/conditions"
import { Overview } from "@/components/dashboard/overview"
import { Explorer } from "@/components/dashboard/explorer"
import { Comparison } from "@/components/dashboard/comparison"
import { Validation } from "@/components/dashboard/validation"
import { About } from "@/components/dashboard/about"

type SectionId = "overview" | "explorer" | "comparison" | "validation" | "about"

const NAV: { id: SectionId; label: string; icon: typeof Gauge }[] = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "explorer", label: "Condition explorer", icon: Compass },
  { id: "comparison", label: "Comparison", icon: BarChart3 },
  { id: "validation", label: "Consistency checks", icon: ShieldCheck },
  { id: "about", label: "About", icon: Info },
]

export default function Page() {
  const [section, setSection] = useState<SectionId>("overview")
  const [conditionId, setConditionId] = useState<string>("healthy")

  function goToCondition(id: string) {
    setConditionId(id)
    setSection("explorer")
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <CircuitBoard className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">Motor CM</p>
            <p className="truncate text-xs text-muted-foreground">Simulation dashboard</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <NavButton
              key={item.id}
              active={section === item.id}
              onClick={() => setSection(item.id)}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>
        <div className="border-t border-border px-5 py-4">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Simulation only. Literature-example parameters. No experimental validation.
          </p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2.5 border-b border-border bg-sidebar px-4 py-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <CircuitBoard className="size-4" aria-hidden />
          </div>
          <p className="text-sm font-semibold text-foreground">{PROJECT.title}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-background/80 px-3 py-2">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                section === item.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
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
        </div>
      </main>
    </div>
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
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {label}
    </button>
  )
}
