"use client"

import { useState, useMemo, useEffect } from "react"
import { X, Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Panel } from "@/components/dashboard/ui"
import { type SimulateResponse } from "@/lib/api"
import { MultiSeriesChart, type DataPoint, type SeriesConfig } from "@/components/simulation/simple-chart"

interface SimulationComparisonProps {
  history: Array<{
    id: string
    timestamp: Date
    params: { scenario_name?: string }
    response: SimulateResponse
    status: "success"
  }>
}

interface PlotSeries {
  id: string
  label: string
  color: string
  dataKey: string
  unit: string
}

const AVAILABLE_SERIES: PlotSeries[] = [
  { id: "Phase A", label: "Phase A current", color: "#3b82f6", dataKey: "three_phase_currents_a", unit: "A" },
  { id: "omega_m", label: "Mechanical speed", color: "#22c55e", dataKey: "omega_m", unit: "rad/s" },
  { id: "tau_e", label: "Electromagnetic torque", color: "#f97316", dataKey: "tau_e", unit: "N·m" },
  { id: "lambda_qs", label: "q-axis stator flux", color: "#14b8a6", dataKey: "lambda_qs", unit: "Wb" },
  { id: "i_qs", label: "q-axis stator current", color: "#06b6d4", dataKey: "i_qs", unit: "A" },
]

function getRunPrefix(run: { id: string; timestamp: Date; params: { scenario_name?: string } }): string {
  const scenario = run.params.scenario_name || run.id.slice(0, 8)
  return `${scenario} · ${run.timestamp.toLocaleString()} · ${run.id.slice(-4)}`
}

function prepareChartData(
  selectedRuns: Array<{
    id: string
    timestamp: Date
    params: { scenario_name?: string }
    response: SimulateResponse
    status: "success"
  }>
): DataPoint[] {
  if (selectedRuns.length === 0) return []

  const refRun = selectedRuns.reduce((a, b) =>
    a.response.outputs?.three_phase_currents_a?.length >=
    b.response.outputs?.three_phase_currents_a?.length ? a : b
  )

  const refTime = refRun.response.outputs?.three_phase_currents_a?.map((o: any) => o.time_s) || []

  return refTime.map((time, idx) => {
    const point: DataPoint = { t: time }

    for (const run of selectedRuns) {
      const { response, params } = run
      const prefix = getRunPrefix(run)

      let closestIdx = 0
      let minDiff = Infinity
      const outputs = response.outputs
      const times = outputs?.three_phase_currents_a?.map((o: any) => o.time_s) || []
      for (let i = 0; i < times.length; i++) {
        const diff = Math.abs(times[i] - time)
        if (diff < minDiff) {
          minDiff = diff
          closestIdx = i
        }
      }

      const keys = ["three_phase_currents_a", "omega_m", "tau_e", "lambda_qs", "i_qs"]
      for (const key of keys) {
        let val: number | null = null
        const data = outputs?.[key]
        if (Array.isArray(data) && data[closestIdx]) {
          val = data[closestIdx].current_a ?? null
        }
        if (val !== null) {
          point[`${prefix}_${key}`] = val
        }
      }
    }

    return point
  })
}

export function SimulationComparison({ history }: SimulationComparisonProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedSeries, setSelectedSeries] = useState<string[]>(["omega_m", "tau_e"])

  useEffect(() => {
    setSelectedIds((current) => {
      const valid = current.filter((id) => history.some((run) => run.id === id)).slice(-2)
      const remaining = history.filter((run) => !valid.includes(run.id)).map((run) => run.id)
      const next = [...valid, ...remaining.slice(0, Math.max(0, 2 - valid.length))]
      return next.length === current.length && next.every((id, index) => id === current[index])
        ? current
        : next
    })
  }, [history])

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev.slice(-1), id]
    )
  }

  const selectedRuns = useMemo(
    () => history.filter((r) => selectedIds.includes(r.id)),
    [history, selectedIds]
  )

  const chartData = useMemo(() => prepareChartData(selectedRuns), [selectedRuns])

  if (history.length === 0) {
    return (
      <Panel className="p-8 text-center">
        <X className="mx-auto size-12 text-muted-foreground/50" />
        <h3 className="mt-2 text-sm font-medium text-foreground">No runs to compare</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete at least two successful simulations to compare their results.
        </p>
      </Panel>
    )
  }

  return (
    <div className="space-y-6">
      {/* Run selector */}
      <Panel className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Select runs to compare</h3>
          <span className="text-xs text-muted-foreground">
            {selectedIds.length} of {history.length} selected
          </span>
        </div>

        <div className="space-y-2">
          {history.map((run) => (
            <label
              key={run.id}
              className={cn(
                "flex items-center gap-3 rounded-lg p-3 transition-colors cursor-pointer",
                selectedIds.includes(run.id)
                  ? "bg-primary/10 border border-primary/30"
                  : "hover:bg-muted/50",
              )}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(run.id)}
                onChange={() => toggleSelection(run.id)}
                className="size-4 accent-primary"
              />
              <Check className="size-4 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {getRunPrefix(run)}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 bg-green-500/10 text-green-300 rounded">
                    Success
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {run.response.outputs?.three_phase_currents_a?.length?.toLocaleString() || 0} pts
                </p>
              </div>
              <Minus className="size-4 text-muted-foreground" />
            </label>
          ))}
        </div>
      </Panel>

      {/* Series selector */}
      <Panel className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Select signals to overlay</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {AVAILABLE_SERIES.map((series) => {
            const available = selectedRuns.some(
              (run) => chartData.some((d) => d[`${getRunPrefix(run)}_${series.dataKey}`] !== undefined)
            )

            return (
              <label
                key={series.id}
                className={cn(
                  "flex items-center gap-2 rounded p-2 text-sm transition-colors cursor-pointer",
                  available
                    ? selectedSeries.includes(series.id)
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted/50"
                    : "opacity-50 cursor-not-allowed",
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedSeries.includes(series.id) && available}
                  onChange={(e) => {
                    setSelectedSeries((prev) =>
                      e.target.checked
                        ? [...prev, series.id]
                        : prev.filter((x) => x !== series.id)
                    )
                  }}
                  disabled={!available}
                  className="size-4 accent-primary"
                />
                <div className="flex items-center gap-2">
                  <div
                    className="size-3 rounded"
                    style={{ backgroundColor: series.color }}
                  />
                  <span className="text-foreground">{series.label}</span>
                  <span className="text-xs text-muted-foreground">({series.unit})</span>
                </div>
              </label>
            )
          })}
        </div>
      </Panel>

      {/* Comparison plots */}
      {selectedSeries.length > 0 && (
        <div className="space-y-6">
          {selectedSeries.map((seriesId) => {
            const series = AVAILABLE_SERIES.find((s) => s.id === seriesId)
            if (!series) return null

            return (
              <Panel key={seriesId} className="p-4">
                <h4 className="text-sm font-medium text-foreground mb-4">
                  {series.label} comparison
                </h4>
                <MultiSeriesChart
                  data={chartData}
                  series={selectedRuns.map((run) => {
                    const prefix = getRunPrefix(run)
                    return {
                      dataKey: `${prefix}_${series.dataKey}`,
                      label: `${prefix}`,
                      color: series.color,
                      unit: series.unit,
                    }
                  })}
                  height={300}
                  yLabel={`${series.label} (${series.unit})`}
                />
              </Panel>
            )
          })}
        </div>
      )}

      {selectedSeries.length === 0 && selectedIds.length > 0 && (
        <Panel className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Select at least one signal above to display the comparison.
          </p>
        </Panel>
      )}

      {selectedIds.length < 2 && (
        <Panel className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Select at least two runs from the history to compare.
          </p>
        </Panel>
      )}
    </div>
  )
}
