export const DASH = "\u2014" // em-dash used for missing / not-reported values

export type NumFmt = {
  /** Fixed number of decimals for non-scientific display. */
  decimals?: number
  /** Force scientific (exponential) notation. Useful for near-zero residuals. */
  sci?: boolean
}

/**
 * Format a numeric value for display only. Never mutates or rounds stored data.
 * Missing values (null / undefined / NaN) render as an em-dash so that
 * "not reported" is always visually distinct from a real zero.
 */
export function fmt(value: number | null | undefined, opts: NumFmt = {}): string {
  if (value === null || value === undefined || Number.isNaN(value)) return DASH

  const { decimals, sci } = opts

  if (sci) return toSci(value)

  const abs = Math.abs(value)
  // Exact zero stays a clean "0" (a genuine reported zero, not a missing value).
  if (value === 0) return "0"
  // Values too small or too large for fixed notation fall back to scientific.
  if (abs < 1e-3 || abs >= 1e6) return toSci(value)

  const d = decimals ?? (abs >= 100 ? 1 : abs >= 1 ? 2 : 4)
  return value.toFixed(d)
}

function toSci(value: number): string {
  // e.g. 9.44e-15 — compact, engineering-readable.
  return value.toExponential(2)
}

/** Format a value with an optional unit; missing values render as a bare em-dash. */
export function fmtUnit(
  value: number | null | undefined,
  unit?: string,
  opts: NumFmt = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return DASH
  const base = fmt(value, opts)
  return unit ? `${base} ${unit}` : base
}
