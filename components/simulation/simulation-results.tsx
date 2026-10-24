"use client"

import { useMemo, useState } from "react"
import { Play, Pause, Download, Info, GitCommitVertical, Gauge, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Panel } from "@/components/dashboard/ui"
import { type SimulateResponse } from "@/lib/api"
import { MultiSeriesChart, type DataPoint, type SeriesConfig } from "./simple-chart"

interface SimulationResultsProps {
  run: {
    id: string
    timestamp: Date
    params: { scenario_name?: string }
    response: SimulateResponse
    status: string
  }
}

function usePlotData(data: SimulateResponse) {
  return useMemo(() => {
    const outputs = data.outputs || {}
    const t = outputs.three_phase_currents_a?.map((o: any) => o.time_s) || []

    const plotData: DataPoint[] = t.map((time: number) => ({
      t: time,
    }))

    // Add three-phase currents
    const currents = [
      { dataKey: "three_phase_currents_a", label: "Phase A", color: "#3b82f6" },
      { dataKey: "three_phase_currents_b", label: "Phase B", color: "#10b981" },
      { dataKey: "three_phase_currents_c", label: "Phase C", color: "#f97316" },
    ]

    for (const curr of currents) {
      const phaseData = outputs[curr.dataKey]
      if (phaseData && phaseData.length > 0) {
        phaseData.forEach((d: { current_a: number | undefined }, i: number) => {
          if (plotData[i]) {
            plotData[i][curr.label] = d.current_a ?? null
          }
        })
      }
    }

    // Add qd0 currents
    const qd0Currents = [
      { dataKey: "qd0_currents_a", label: "i_qs", color: "#06b6d4" },
      { dataKey: "qd0_currents_b", label: "i_ds", color: "#f59e0b" },
    ]

    for (const curr of qd0Currents) {
      const qd0Data = outputs[curr.dataKey]
      if (qd0Data && qd0Data.length > 0) {
        qd0Data.forEach((d: { current_a: number | undefined }, i: number) => {
          if (plotData[i]) {
            plotData[i][curr.label] = d.current_a ?? null
          }
        })
      }
    }

    // Add additional outputs from outputs (omega_m, tau_e, etc.)
    const additionalOutputs = [
      "omega_m",
      "tau_e",
      "tau_l",
      "lambda_qs",
      "lambda_ds",
      "i_qs",
    ]

    for (const key of additionalOutputs) {
      const outputData = (outputs as any)[key]
      if (outputData && outputData.length > 0) {
        outputData.forEach((d: any, i: number) => {
          if (plotData[i]) {
            plotData[i][key] = d.current_a ?? null
          }
        })
      }
    }

    return plotData
  }, [data])
}

export function SimulationResults({ run }: SimulationResultsProps) {
  const { response, params } = run
  const plotData = usePlotData(response)
  const metadata = response.metadata
  const provenanceLabel = params.scenario_name || "unknown"

  const phaseCurrentSeries: SeriesConfig[] = [
    { dataKey: "Phase A", label: "Phase A", color: "#3b82f6", unit: "A" },
    { dataKey: "Phase B", label: "Phase B", color: "#10b981", unit: "A" },
    { dataKey: "Phase C", label: "Phase C", color: "#f97316", unit: "A" },
  ]

  const mechanicalSeries: SeriesConfig[] = [
    { dataKey: "omega_m", label: "Mechanical speed", color: "#22c55e", unit: "rad/s" },
    { dataKey: "tau_e", label: "Electromagnetic torque", color: "#f97316", unit: "N·m" },
  ]

  const fluxSeries: SeriesConfig[] = [
    { dataKey: "lambda_qs", label: "q-axis stator flux", color: "#14b8a6", unit: "Wb" },
    { dataKey: "lambda_ds", label: "d-axis stator flux", color: "#8b5cf6", unit: "Wb" },
  ]

  const dqCurrentSeries: SeriesConfig[] = [
    { dataKey: "i_qs", label: "q-axis stator current", color: "#06b6d4", unit: "A" },
    { dataKey: "i_ds", label: "d-axis stator current", color: "#f59e0b", unit: "A" },
  ]

  return (
    <div className="space-y-6">
      {/* Run info header with parameter summary */}
      <Panel className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Simulation Result: {provenanceLabel}
            </h3>
            <p className="text-xs text-muted-foreground">
              {metadata.provenance} · {metadata.park_convention} · {metadata.solver}
            </p>
            <p className="text-xs text-muted-foreground">
              {metadata.n_eval?.toLocaleString()} evaluation points · max_step={metadata.max_step_s}s · rtol={metadata.rtol}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>
              {metadata.load_torque_nm?.toFixed(2)} N·m @ {metadata.supply_frequency_hz} Hz
            </p>
            <p className="mt-1">{metadata.load_type}</p>
            <p className="mt-1 text-[10px] capitalize">{metadata.stator_resistance_case}</p>
          </div>
        </div>
        <Info className="size-5 text-muted-foreground" aria-label="Simulation info" />
      </Panel>

      {/* Plots */}
      <Panel className="p-4">
        <h4 className="text-sm font-medium text-foreground mb-4">Three-phase currents</h4>
        <MultiSeriesChart data={plotData} series={phaseCurrentSeries} height={300} yLabel="Current (A)" />
      </Panel>

      <Panel className="p-4">
        <h4 className="text-sm font-medium text-foreground mb-4">Mechanical & torque results</h4>
        <div className="grid gap-6 sm:grid-cols-2">
          <MultiSeriesChart data={plotData} series={[mechanicalSeries[0]]} height={250} yLabel="Speed (rad/s)" />
          <MultiSeriesChart data={plotData} series={[mechanicalSeries[1]]} height={250} yLabel="Torque (N·m)" />
        </div>
      </Panel>

      <Panel className="p-4">
        <h4 className="text-sm font-medium text-foreground mb-4">Flux linkage (qd0)</h4>
        <div className="grid gap-6 sm:grid-cols-2">
          <MultiSeriesChart data={plotData} series={[fluxSeries[0]]} height={250} yLabel="Flux (Wb)" />
          <MultiSeriesChart data={plotData} series={[fluxSeries[1]]} height={250} yLabel="Flux (Wb)" />
        </div>
      </Panel>

      <Panel className="p-4">
        <h4 className="text-sm font-medium text-foreground mb-4">dq-axis currents</h4>
        <div className="grid gap-6 sm:grid-cols-2">
          <MultiSeriesChart data={plotData} series={[dqCurrentSeries[0]]} height={250} yLabel="Current (A)" />
          <MultiSeriesChart data={plotData} series={[dqCurrentSeries[1]]} height={250} yLabel="Current (A)" />
        </div>
      </Panel>

      {/* MQTT streaming report (V2.4) */}
      {response.mqtt_streaming_report && Object.keys(response.mqtt_streaming_report).length > 0 && (() => {
        const report = Object.values(response.mqtt_streaming_report)[0];
        return (
          <Panel className="p-4 bg-muted/30 border-amber-500/25 mt-4">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <AlertCircle className="size-3 text-amber-400" />
              MQTT streaming status
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Channel:</span>
                <span>{Object.keys(response.mqtt_streaming_report)[0]}</span>
              </div>
              <div>
                <span className="font-medium">Total packets:</span>
                <span>{report.total_packets_received}</span>
              </div>
              <div>
                <span className="font-medium">Duplicates:</span>
                <span>{report.duplicate_count}</span>
              </div>
              <div>
                <span className="font-medium">Gaps:</span>
                <span>{report.gap_count}</span>
              </div>
              <div>
                <span className="font-medium">Out-of-order:</span>
                <span>{report.out_of_order_count}</span>
              </div>
              <div>
                <span className="font-medium">Malformed:</span>
                <span>{report.malformed_count}</span>
              </div>
            </div>
            <p className="mt-2 text-[9px] text-amber-300/80">
              Versioned JSON messages with schema v1.0.0, window buffer reassembly,
              and gap/duplicate/out-of-order detection. All traces remain simulated,
              literature-example parameters.
            </p>
          </Panel>
        )
      })()}

      {/* Metadata panel */}
      <Panel className="p-4 bg-muted/20">
        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Gauge className="size-4" />
          Simulation metadata
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Scenario:</span>
            <span className="ml-2 text-foreground font-medium">{params.scenario_name || provenanceLabel}</span>
          </div>
          <div>
            <span className="text-muted-foreground">t_end:</span>
            <span className="ml-2 text-foreground">{metadata.t_end_s}s</span>
          </div>
          <div>
            <span className="text-muted-foreground">Max step:</span>
            <span className="ml-2 text-foreground">{metadata.max_step_s}s</span>
          </div>
          <div>
            <span className="text-muted-foreground">nfev:</span>
            <span className="ml-2 text-foreground">{metadata.nfev?.toLocaleString() || 0}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Supply frequency:</span>
            <span className="ml-2 text-foreground">{metadata.supply_frequency_hz} Hz</span>
          </div>
          <div>
            <span className="text-muted-foreground">Load torque:</span>
            <span className="ml-2 text-foreground">{metadata.load_torque_nm} N·m ({metadata.load_type})</span>
          </div>
          <div>
            <span className="text-muted-foreground">Solver status:</span>
            <span className="ml-2 text-foreground">{metadata.message}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Experimental validation:</span>
            <span className="ml-2 text-rose-400">No</span>
          </div>
        </div>
      </Panel>
    </div>
  )
}