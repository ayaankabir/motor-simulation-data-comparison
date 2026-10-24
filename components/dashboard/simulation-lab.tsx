"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Save } from "lucide-react"
import { simulate, type SimulateRequest, type SimulateResponse, type SimulateLimits } from "@/lib/api"
import { Panel } from "@/components/dashboard/ui"
import { SimulationComparison } from "@/components/simulation/simulation-comparison"
import { SimulationHistory } from "@/components/simulation/simulation-history"
import { SimulationResults } from "@/components/simulation/simulation-results"
import { DISCLAIMER } from "@/lib/simulation"
import { updateParameterOverride } from "@/lib/simulation-request"
import {
  clearSavedSimulationRuns,
  isStorageQuotaError,
  loadSavedSimulationRuns,
  saveSimulationRun,
  type SavedSimulationRun,
} from "@/lib/simulation-storage"

interface SimulationParams {
  t_end: number
  max_step: number
  output_dt: number
  rtol: number
  atol: number
  y0?: number[]
  param_overrides?: Record<string, number>
  noise_seed?: number
  scenario?: string
}

type SimulationRunSuccess = {
  id: string
  timestamp: Date
  params: SimulateRequest
  response: SimulateResponse
  status: "success"
}

type SimulationRun = {
  id: string
  timestamp: Date
  params: SimulateRequest
  response: SimulateResponse | null
  status: "running" | "success" | "error"
  error?: string
}

function toSavedRun(run: SimulationRunSuccess): SavedSimulationRun {
  return {
    id: run.id,
    timestamp: run.timestamp.toISOString(),
    params: run.params,
    response: run.response,
    status: "success",
  }
}

function useSimulation() {
  const [limits, setLimits] = useState<SimulateLimits | null>(null)
  const [isLoadingLimits, setIsLoadingLimits] = useState(true)
  const [errorLimits, setErrorLimits] = useState<string | null>(null)

  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SimulationRunSuccess | null>(null)

  // Load limits on mount
  useEffect(() => {
    async function loadLimits() {
      setIsLoadingLimits(true)
      setErrorLimits(null)
      try {
        const response = await simulate.limits()
        if (!response.connected || !response.data) {
          throw new Error(response.error || "Failed to load simulation limits")
        }
        setLimits(response.data)
      } catch (error) {
        setErrorLimits(error instanceof Error ? error.message : "Failed to load simulation limits")
      } finally {
        setIsLoadingLimits(false)
      }
    }
    loadLimits()
  }, [])

  // Run simulation
  const runSimulation = useCallback(async (params: SimulateRequest): Promise<SimulationRunSuccess | null> => {
    setIsRunning(true)
    setIsSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const response = await simulate.request(params)
      if (!response.connected || !response.data) {
        throw new Error(response.error || "Simulation response unavailable")
      }
      const completed: SimulationRunSuccess = {
        id: `${params.scenario_name}_${Date.now()}`,
        timestamp: new Date(),
        params,
        response: response.data,
        status: "success",
      }
      setResult(completed)
      return completed
    } catch (error) {
      setError(error instanceof Error ? error.message : "Simulation failed")
      return null
    } finally {
      setIsRunning(false)
      setIsSubmitting(false)
    }
  }, [])

  // Reset form state
  const reset = useCallback(() => {
    setError(null)
    setResult(null)
    setIsRunning(false)
    setIsSubmitting(false)
  }, [])

  return {
    limits,
    isLoadingLimits,
    errorLimits,
    isRunning,
    isSubmitting,
    error,
    result,
    setResult,
    runSimulation,
    reset,
  }
}

export function SimulationLab() {
  const {
    limits,
    isLoadingLimits,
    errorLimits,
    isRunning,
    isSubmitting,
    error,
    result,
    setResult,
    runSimulation,
    reset,
  } = useSimulation()

  const [tab, setTab] = useState<"run" | "history" | "compare">("run")
  const [history, setHistory] = useState<SimulationRun[]>([])
  const [savedRunIds, setSavedRunIds] = useState<Set<string>>(() => new Set())
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const saveInProgress = useRef(false)

  // Form state
  const [form, setForm] = useState<SimulationParams>({
    t_end: 1,
    max_step: 1e-4,
    output_dt: 1e-4,
    rtol: 1e-6,
    atol: 1e-8,
    scenario: "healthy",
  })

  useEffect(() => {
    let cancelled = false
    loadSavedSimulationRuns().then(({ runs, warning }) => {
      if (cancelled) return
      const savedRuns: SimulationRun[] = runs.map((run) => ({
        ...run,
        timestamp: new Date(run.timestamp),
      }))
      setHistory((current) => {
        const byId = new Map<string, SimulationRun>(savedRuns.map((run) => [run.id, run]))
        current.forEach((run) => byId.set(run.id, run))
        return [...byId.values()].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      })
      setSavedRunIds(new Set(runs.map((run) => run.id)))
      if (warning) setSaveMessage(warning)
    }).catch(() => {
      if (!cancelled) setSaveMessage("Saved simulations could not be loaded from this browser.")
    })
    return () => { cancelled = true }
  }, [])

  const saveCurrentRun = useCallback(async () => {
    if (!result || saveInProgress.current || savedRunIds.has(result.id)) return
    saveInProgress.current = true
    setSaving(true)
    setSaveMessage(null)
    try {
      await saveSimulationRun(toSavedRun(result))
      setSavedRunIds((current) => new Set(current).add(result.id))
      setSaveMessage("Simulation saved in this browser.")
    } catch (error) {
      setSaveMessage(isStorageQuotaError(error)
        ? "Browser storage is full. This result is still available on this page, but it was not saved. Free browser storage and try again."
        : "This result is still available on this page, but it could not be saved to browser storage. Check browser storage and try again.")
    } finally {
      saveInProgress.current = false
      setSaving(false)
    }
  }, [result, savedRunIds])

  const clearHistory = useCallback(async () => {
    if (!window.confirm("Clear all saved simulation runs from this browser?")) return
    try {
      await clearSavedSimulationRuns()
      setHistory([])
      setSavedRunIds(new Set())
      setSaveMessage(null)
    } catch {
      setSaveMessage("Saved runs could not be cleared from browser storage.")
    }
  }, [])

  const copyParams = useCallback(async (params: SimulateRequest, runId: string) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(params, null, 2))
      setCopiedId(runId)
      window.setTimeout(() => setCopiedId(null), 2000)
    } catch {
      setSaveMessage("Parameters could not be copied. Check clipboard permissions.")
    }
  }, [])

  // Initialize form from limits if available
  useEffect(() => {
    if (limits) {
      setForm({
        t_end: limits.t_end.default,
        max_step: limits.max_step.default,
        output_dt: limits.output_dt.default,
        rtol: limits.rtol.default,
        atol: limits.atol.default,
        scenario: limits.scenario.available[0] || "healthy",
      })
    }
  }, [limits])

  // Handle simulation submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const req: SimulateRequest = {
        scenario_name: form.scenario || "healthy",
        t_end: form.t_end,
        max_step: form.max_step,
        output_dt: form.output_dt,
        rtol: form.rtol,
        atol: form.atol,
        ...(form.param_overrides && { param_overrides: form.param_overrides }),
        ...(form.noise_seed !== undefined && { noise_seed: form.noise_seed }),
      }

      const completed = await runSimulation(req)
      if (completed) {
        setHistory((current) => [completed, ...current.filter((run) => run.id !== completed.id)])
        setTab("run")
      }
    },
    [form, runSimulation]
  )

  // Main simulation form using native HTML
  const successfulHistory = history.filter(
    (run): run is SimulationRunSuccess => run.status === "success" && run.response !== null,
  )

  return (
    <div className="space-y-5">
      <Panel className="border-amber-500/25 bg-amber-500/[0.05] p-3 sm:p-4">
        <p className="text-sm leading-relaxed text-amber-100/90">{DISCLAIMER}</p>
      </Panel>
      <nav aria-label="Simulation sections" className="flex flex-wrap gap-2">
        {([ ["run", "Run simulation"], ["history", "History"], ["compare", "Compare runs"] ] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined}
            className={`rounded-md border px-3 py-2 text-sm ${tab === id ? "border-primary/40 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {label}{id === "history" ? ` (${history.length})` : ""}
          </button>
        ))}
      </nav>

      {tab === "run" && <div className="space-y-5">
      {isLoadingLimits && <Panel className="p-4 text-sm text-muted-foreground">Loading simulation limits…</Panel>}
      {errorLimits && <div role="alert"><Panel className="border-amber-500/30 p-4 text-sm text-amber-100">Simulation limits unavailable: {errorLimits}</Panel></div>}
      {error && <div role="alert"><Panel className="border-rose-500/30 p-4 text-sm text-rose-200">Simulation failed: {error}</Panel></div>}
      {saveMessage && <p role="status" className="text-sm text-muted-foreground">{saveMessage}</p>}
      <div className="rounded-xl border border-border bg-card/60 p-4 sm:p-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        noValidate
      >
        {/* Provenance disclaimer */}
        <div className="bg-muted/30 p-4 rounded mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Simulation only — literature-example parameters. No experimental validation.
          </p>
        </div>

        {/* t_end */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Simulation duration (t_end)
            <span className="text-xs text-muted-foreground">s</span>
          </label>
          <input
            type="number"
            value={form.t_end}
            onChange={(e) =>
              setForm((f) => ({ ...f, t_end: Number(e.target.value) }))
            }
            min="0.1"
            max="60"
            step="0.1"
            disabled={isRunning}
            className="w-full rounded border bg-card p-2 text-sm font-medium text-foreground placeholder:text-muted-foreground"
            placeholder="1"
          />
        </div>

        {/* max_step */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Solver max step
            <span className="text-xs text-muted-foreground">s</span>
          </label>
          <input
            type="number"
            value={form.max_step}
            onChange={(e) =>
              setForm((f) => ({ ...f, max_step: Number(e.target.value) }))
            }
            min="1e-6"
            max="1"
            step="1e-6"
            disabled={isRunning}
            className="w-full rounded border bg-card p-2 text-sm font-medium text-foreground placeholder:text-muted-foreground"
            placeholder="1e-4"
          />
        </div>

        {/* output_dt */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Output interval
            <span className="text-xs text-muted-foreground">s</span>
          </label>
          <input
            type="number"
            value={form.output_dt}
            onChange={(e) =>
              setForm((f) => ({ ...f, output_dt: Number(e.target.value) }))
            }
            min="1e-6"
            max="0.1"
            step="1e-6"
            disabled={isRunning}
            className="w-full rounded border bg-card p-2 text-sm font-medium text-foreground placeholder:text-muted-foreground"
            placeholder="1e-4"
          />
        </div>

        {/* rtol */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Relative tolerance
            <span className="text-xs text-muted-foreground">—</span>
          </label>
          <input
            type="number"
            value={form.rtol}
            onChange={(e) =>
              setForm((f) => ({ ...f, rtol: Number(e.target.value) }))
            }
            min="1e-12"
            max="1"
            step="1e-12"
            disabled={isRunning}
            className="w-full rounded border bg-card p-2 text-sm font-medium text-foreground placeholder:text-muted-foreground"
            placeholder="1e-6"
          />
        </div>

        {/* atol */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Absolute tolerance
            <span className="text-xs text-muted-foreground">—</span>
          </label>
          <input
            type="number"
            value={form.atol}
            onChange={(e) =>
              setForm((f) => ({ ...f, atol: Number(e.target.value) }))
            }
            min="1e-12"
            max="1"
            step="1e-12"
            disabled={isRunning}
            className="w-full rounded border bg-card p-2 text-sm font-medium text-foreground placeholder:text-muted-foreground"
            placeholder="1e-8"
          />
        </div>

        {/* scenario */}
        {limits && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Scenario
              <span className="text-xs text-muted-foreground">—</span>
            </label>
            <select
              value={form.scenario || limits.scenario.available[0] || "healthy"}
              onChange={(e) => setForm((current) => ({ ...current, scenario: e.target.value }))}
              disabled={isRunning}
              className="w-full rounded border bg-card p-2 text-sm font-medium text-foreground placeholder:text-muted-foreground"
            >
              {limits.scenario.available.map((scenario) => <option key={scenario} value={scenario}>{scenario}</option>)}
            </select>
          </div>
        )}

        {/* param_overrides */}
        {limits && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Parameter overrides (optional)
              <span className="text-xs text-muted-foreground">
                Valid keys: {limits.param_overrides.valid_keys.join(", ")}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {limits.param_overrides.valid_keys.map((key) => (
                <input
                  key={key}
                  type="number"
                  placeholder={key}
                  value={form.param_overrides?.[key] ?? ""}
                  onChange={(e) => {
                    const param_overrides = updateParameterOverride(form.param_overrides, key, e.target.value)
                    setForm((current) => ({ ...current, param_overrides }))
                  }}
                  disabled={isRunning}
                  className="w-full rounded border bg-card p-2 text-sm font-medium text-foreground placeholder:text-muted-foreground"
                />
              ))}
            </div>
          </div>
        )}

        {/* noise_seed */}
        {limits && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Noise seed (optional, for reproducible measurement-noise injection)
              <span className="text-xs text-muted-foreground">
                Same seed + same config → identical results
              </span>
            </label>
            <input
              type="number"
              value={form.noise_seed ?? ""}
              onChange={(e) => {
                const val = e.target.value === "" ? undefined : Number(e.target.value)
                setForm({ ...form, noise_seed: val })
              }}
              disabled={isRunning}
              className="w-full rounded border bg-card p-2 text-sm font-medium text-foreground placeholder:text-muted-foreground"
              placeholder="e.g., 42"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isRunning || isSubmitting}
          className="w-full rounded border bg-primary px-4 py-2 text-lg font-medium text-white hover:bg-primary/90"
        >
          {isRunning ? "Running..." : "Run Simulation"}
        </button>

        {isSubmitting && (
          <p className="text-sm text-muted-foreground mt-2">Running simulation...</p>
        )}
      </form>
      </div>
      {result && <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Simulation outputs</h2>
          <button type="button" onClick={saveCurrentRun} disabled={saving || savedRunIds.has(result.id)}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground disabled:opacity-60">
            <Save className="size-4" aria-hidden />{savedRunIds.has(result.id) ? "Saved" : saving ? "Saving…" : "Save run"}
          </button>
        </div>
        <SimulationResults run={result} />
      </div>}
      </div>}
      {tab === "history" && <SimulationHistory history={history} currentRunId={result?.id} copiedId={copiedId}
        onView={(run) => { if (run.status === "success" && run.response) { setResult({ ...run, status: "success", response: run.response }); setTab("run") } }}
        onRerun={async (run) => {
          const completed = await runSimulation(run.params)
          if (completed) setHistory((current) => [completed, ...current.filter((item) => item.id !== completed.id)])
          setTab("run")
        }}
        onCopyParams={copyParams} onClear={clearHistory} />}
      {tab === "compare" && <SimulationComparison history={successfulHistory} />}
    </div>
  )
}
