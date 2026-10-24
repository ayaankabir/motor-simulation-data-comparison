export function updateParameterOverride(
  overrides: Record<string, number> | undefined,
  key: string,
  rawValue: string,
): Record<string, number> | undefined {
  const next = { ...overrides }
  if (rawValue.trim() === "") {
    delete next[key]
  } else {
    const value = Number(rawValue)
    if (Number.isFinite(value)) next[key] = value
  }
  return Object.keys(next).length > 0 ? next : undefined
}
