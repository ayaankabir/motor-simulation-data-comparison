"use client"

import { Trash2, Play, Copy, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Panel } from "@/components/dashboard/ui"
import { type SimulateRequest, type SimulateResponse } from "@/lib/api"

interface SimulationRun {
  id: string
  timestamp: Date
  params: SimulateRequest
  response: SimulateResponse | null
  status: "running" | "success" | "error"
  error?: string
}

interface SimulationHistoryProps {
  history: SimulationRun[]
  onRerun: (run: SimulationRun) => void
  onCopyParams: (params: SimulateRequest, runId: string) => void
  onClear: () => void
  onView: (run: SimulationRun) => void
  currentRunId?: string
  copiedId: string | null
}

export function SimulationHistory({
  history,
  onRerun,
  onCopyParams,
  onClear,
  onView,
  currentRunId,
  copiedId,
}: SimulationHistoryProps) {
  if (history.length === 0) {
    return (
      <Panel className="p-8 text-center">
        <Clock className="mx-auto size-12 text-muted-foreground/50" />
        <h3 className="mt-2 text-sm font-medium text-foreground">No simulation history</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Run simulations from the Simulation Lab to build history.
        </p>
      </Panel>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Simulation History</h2>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-500/30 transition-colors"
        >
          <Trash2 className="size-3" />
          Clear all
        </button>
      </div>

      <div className="space-y-3">
        {history.map((run) => {
          const isActive = run.id === currentRunId
          const isSuccess = run.status === "success"

          return (
            <Panel
              key={run.id}
              className={cn(
                "p-4 transition-colors",
                isActive && "border-primary/30 bg-primary/5",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {run.status === "running" ? (
                    <div className="animate-spin rounded-full p-0.5">
                      <div className="size-4 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : isSuccess ? (
                    <CheckCircle className="size-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="size-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {run.params.scenario_name || "unknown scenario"}
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded",
                        isSuccess ? "bg-green-500/10 text-green-300" :
                        run.status === "running" ? "bg-amber-500/10 text-amber-300" :
                        "bg-rose-500/10 text-rose-300",
                      )}>
                        {run.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <Clock className="inline size-3 mr-1" />
                      {run.timestamp.toLocaleString()} · {run.id}
                    </div>
                    {run.error && (
                      <p className="text-xs text-rose-300 max-w-xs break-all">
                        {run.error}
                      </p>
                    )}
                    {isSuccess && run.response && (
                      <p className="text-xs text-muted-foreground">
                        {run.response.outputs.three_phase_currents_a.length.toLocaleString()} points · {run.response.metadata.solver}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isActive && isSuccess && (
                    <span title="Currently viewing this run">
                      <AlertCircle className="size-4 text-primary" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onView(run)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    title={isActive && isSuccess ? "Viewing this run" : "View this run"}
                  >
                    <Play className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRerun(run)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    title="Re-run this simulation"
                  >
                    <RefreshCwIcon className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onCopyParams(run.params, run.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    title={copiedId === run.id ? "Copied!" : "Copy parameters"}
                  >
                    {copiedId === run.id ? <CheckCircle className="size-3 text-green-400" /> : <Copy className="size-3" />}
                  </button>
                </div>
              </div>
            </Panel>
          )
        })}
      </div>
    </div>
  )
}

// Inline RefreshCw icon to avoid unused import warning
function RefreshCwIcon(props: { className?: string }) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.77 9.77 0 0 1 6.74 2.74L21 8" />
      <path d="M21 2v6h-6" />
      <path d="M12 19a9 9 0 0 1-6.74-2.74L3 15" />
      <path d="M3 21l6-6" />
    </svg>
  )
}
