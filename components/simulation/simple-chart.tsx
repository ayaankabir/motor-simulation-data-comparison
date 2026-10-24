"use client"

import { useMemo, useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export interface DataPoint {
  t: number
  [key: string]: number | null | undefined
}

export interface SeriesConfig {
  dataKey: string
  label: string
  color: string
  unit: string
}

interface SimpleChartProps {
  data: DataPoint[]
  series: SeriesConfig[]
  width?: number
  height?: number
  xLabel?: string
  yLabel?: string
  className?: string
  showGrid?: boolean
  showLegend?: boolean
}

const CHART_THEME = {
  background: "transparent",
  gridColor: "oklch(0.68 0.03 255)",
  axisColor: "oklch(0.65 0.03 255)",
  tickLabelColor: "oklch(0.92 0.01 255)",
  axisLabelColor: "oklch(0.97 0.005 255)",
  legendTextColor: "oklch(0.95 0.01 255)",
  legendBgColor: "hsl(var(--card))",
  noDataColor: "oklch(0.75 0.02 255)",
} as const

function formatTick(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1000 || (abs > 0 && abs < 0.01)) {
    return value.toExponential(2)
  }
  return value.toFixed(abs >= 10 ? 0 : abs >= 1 ? 2 : 3)
}

function getExtent(data: DataPoint[], key: string): [number, number] {
  let min = Infinity
  let max = -Infinity
  for (const d of data) {
    const v = d[key]
    if (v !== undefined && v !== null) {
      if (v < min) min = v
      if (v > max) max = v
    }
  }
  if (min === Infinity) return [0, 1]
  const padding = (max - min) * 0.1 || (max === min ? Math.abs(max) * 0.1 || 0.1 : 0.1)
  return [min - padding, max + padding]
}

function getNiceTicks(min: number, max: number, count = 5): number[] {
  const range = max - min
  if (range === 0) return [min]
  const step = Math.pow(10, Math.floor(Math.log10(range / (count - 1))))
  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = niceMin; v <= niceMax + step * 0.5; v += step) {
    ticks.push(Math.round(v / step) * step)
  }
  return ticks.length > count ? ticks.filter((_, i) => i % Math.ceil(ticks.length / count) === 0) : ticks
}

export function SimpleChart({
  data,
  series,
  width = 600,
  height = 300,
  xLabel = "Time (s)",
  yLabel = "",
  className,
  showGrid = true,
  showLegend = true,
}: SimpleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(width)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth || width)
      }
    }
    updateWidth()
    const ro = new ResizeObserver(updateWidth)
    ro.observe(containerRef.current!)
    return () => ro.disconnect()
  }, [width])

  const effectiveWidth = containerWidth
  const margin = { top: 28, right: 36, bottom: 56, left: 80 }
  const innerWidth = effectiveWidth - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const xExtent = getExtent(data, "t")
  const yValues = series.flatMap((s) =>
    data.map((d) => d[s.dataKey]).filter((v): v is number => v !== undefined && v !== null)
  )
  const yExtent = yValues.length
    ? [Math.min(...yValues), Math.max(...yValues)]
    : [0, 1]
  const xTicks = useMemo(() => getNiceTicks(xExtent[0], xExtent[1], 6), [xExtent])
  const yTicks = useMemo(() => getNiceTicks(yExtent[0], yExtent[1], 5), [yExtent])

  if (!data.length || !series.length || innerWidth <= 0 || innerHeight <= 0) {
    return (
      <div
        ref={containerRef}
        className={cn("w-full", className)}
        style={{ height }}
      >
        <div className="w-full h-full flex items-center justify-center text-muted-foreground/60 text-sm">
          No data to display
        </div>
      </div>
    )
  }

  const xScale = (t: number) =>
    margin.left + ((t - xExtent[0]) / (xExtent[1] - xExtent[0])) * innerWidth
  const yScale = (v: number) =>
    margin.top + innerHeight - ((v - yExtent[0]) / (yExtent[1] - yExtent[0])) * innerHeight

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      style={{ minHeight: height }}
    >
      <svg width={effectiveWidth} height={height} className="block max-w-full" style={{ background: CHART_THEME.background }}>
        {showGrid && (
          <>
            {xTicks.map((tick) => (
              <line
                key={tick}
                x1={xScale(tick)}
                y1={margin.top}
                x2={xScale(tick)}
                y2={margin.top + innerHeight}
                stroke={CHART_THEME.gridColor}
                strokeWidth={0.5}
                strokeDasharray="3 3"
                opacity={0.5}
              />
            ))}
            {yTicks.map((tick) => (
              <line
                key={tick}
                x1={margin.left}
                x2={margin.left + innerWidth}
                y1={yScale(tick)}
                y2={yScale(tick)}
                stroke={CHART_THEME.gridColor}
                strokeWidth={0.5}
                strokeDasharray="3 3"
                opacity={0.5}
              />
            ))}
          </>
        )}

        <rect
          x={margin.left}
          y={margin.top}
          width={innerWidth}
          height={innerHeight}
          fill="none"
          stroke={CHART_THEME.axisColor}
          strokeWidth={1}
        />

        {series.map((s) => {
          const points = data
            .map((d) => {
              const v = d[s.dataKey]
              if (v === undefined || v === null) return null
              return `${xScale(d.t)},${yScale(v)}`
            })
            .filter(Boolean)
            .join(" ")

          if (!points) return null

          return (
            <polyline
              key={s.dataKey}
              points={points}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 1px currentColor)"
            />
          )
        })}

        <g fontSize={11} fill={CHART_THEME.tickLabelColor} fontFamily="system-ui, -apple-system, sans-serif">
          {xTicks.map((tick) => (
            <text
              key={tick}
              x={xScale(tick)}
              y={height - margin.bottom + 20}
              textAnchor="middle"
              dominantBaseline="hanging"
            >
              {formatTick(tick)}
            </text>
          ))}
          {yTicks.map((tick) => (
            <text
              key={tick}
              x={margin.left - 10}
              y={yScale(tick)}
              textAnchor="end"
              dominantBaseline="central"
            >
              {formatTick(tick)}
            </text>
          ))}
        </g>

        <text
          x={effectiveWidth / 2}
          y={height - 6}
          textAnchor="middle"
          dominantBaseline="alphabetic"
          fontSize={12}
          fill={CHART_THEME.axisLabelColor}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={500}
        >
          {xLabel}
        </text>

        <text
          x={14}
          y={margin.top - 8}
          textAnchor="start"
          dominantBaseline="alphabetic"
          fontSize={12}
          fill={CHART_THEME.axisLabelColor}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={500}
        >
          {yLabel}
        </text>

      </svg>
      {showLegend && series.length > 0 && (
        <div className="flex w-full flex-wrap gap-x-4 gap-y-2 px-2 pt-2" role="list" aria-label="Chart legend">
          {series.map((s) => {
            const label = `${s.label} (${s.unit})`
            return (
              <div
                key={s.dataKey}
                className="flex min-w-0 max-w-full items-center gap-2"
                role="listitem"
                title={label}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                  aria-hidden="true"
                />
                <span className="min-w-0 max-w-full truncate text-xs text-foreground" aria-label={label}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function MultiSeriesChart({
  data,
  series,
  width = 600,
  height = 300,
  xLabel = "Time (s)",
  yLabel = "",
  className,
}: {
  data: DataPoint[]
  series: SeriesConfig[]
  width?: number
  height?: number
  xLabel?: string
  yLabel?: string
  className?: string
}) {
  return <SimpleChart data={data} series={series} width={width} height={height} xLabel={xLabel} yLabel={yLabel} className={className} />
}
