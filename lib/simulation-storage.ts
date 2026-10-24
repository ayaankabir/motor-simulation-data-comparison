import type { SimulateRequest, SimulateResponse } from "@/lib/api"

export interface SavedSimulationRun {
  id: string
  timestamp: string
  params: SimulateRequest
  response: SimulateResponse
  status: "success"
}

const DATABASE_NAME = "motor-cm-simulation-history"
const DATABASE_VERSION = 1
const STORE_NAME = "runs"
const LEGACY_KEY_PREFIX = "sim_run_"

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isSavedSimulationRun(value: unknown): value is SavedSimulationRun {
  if (!isObject(value) || typeof value.id !== "string" || !value.id) return false
  if (typeof value.timestamp !== "string" || Number.isNaN(Date.parse(value.timestamp))) return false
  if (value.status !== "success" || !isObject(value.params) || typeof value.params.scenario_name !== "string") return false
  if (!isObject(value.response) || typeof value.response.scenario_name !== "string") return false
  if (!isObject(value.response.outputs) || !isObject(value.response.metadata)) return false

  const outputKeys = [
    "three_phase_currents_a", "three_phase_currents_b", "three_phase_currents_c",
    "qd0_currents_a", "qd0_currents_b", "omega_m", "tau_e", "tau_l",
    "lambda_qs", "lambda_ds", "i_qs",
  ]
  for (const key of outputKeys) {
    const samples = value.response.outputs[key]
    if (samples === undefined && key !== "three_phase_currents_a") continue
    if (!Array.isArray(samples) || samples.some((sample) =>
      !isObject(sample) || !Number.isFinite(sample.time_s) || !Number.isFinite(sample.current_a)
    )) return false
  }
  return true
}

export function parseLegacySimulationRun(id: string, raw: string): SavedSimulationRun | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isObject(parsed) || !isObject(parsed.params) || !isObject(parsed.response)) return null
    const timestampFromId = Number(id.match(/_(\d+)(?:_|$)/)?.[1])
    const timestamp = Number.isFinite(timestampFromId)
      ? new Date(timestampFromId).toISOString()
      : new Date().toISOString()
    const run = {
      id,
      timestamp,
      params: parsed.params,
      response: parsed.response,
      status: "success" as const,
    }
    return isSavedSimulationRun(run) ? run : null
  } catch {
    return null
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is unavailable in this browser."))
      return
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error("Could not open simulation storage."))
    request.onblocked = () => reject(new Error("Simulation storage is busy in another tab."))
  })
}

function readAll(database: IDBDatabase): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly")
    const request = transaction.objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error("Could not read saved simulations."))
    transaction.onabort = () => reject(transaction.error || new Error("Could not read saved simulations."))
  })
}

function writeRun(database: IDBDatabase, run: SavedSimulationRun): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite")
    transaction.objectStore(STORE_NAME).put(run)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error || new Error("Could not save the simulation."))
    transaction.onabort = () => reject(transaction.error || new Error("Could not save the simulation."))
  })
}

function getLegacyEntries(): Array<{ key: string; run: SavedSimulationRun }> {
  if (typeof window === "undefined") return []
  try {
    const storage = window.localStorage
    const entries: Array<{ key: string; run: SavedSimulationRun }> = []
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index)
      if (!key?.startsWith(LEGACY_KEY_PREFIX)) continue
      const raw = storage.getItem(key)
      if (!raw) continue
      const run = parseLegacySimulationRun(key.slice(LEGACY_KEY_PREFIX.length), raw)
      if (run) entries.push({ key, run })
    }
    return entries
  } catch {
    return []
  }
}

function readLegacyRuns(): SavedSimulationRun[] {
  return getLegacyEntries().map(({ run }) => run)
}

export async function loadSavedSimulationRuns(): Promise<{
  runs: SavedSimulationRun[]
  warning?: string
}> {
  const legacyEntries = getLegacyEntries()
  let database: IDBDatabase
  try {
    database = await openDatabase()
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Browser storage is unavailable."
    return { runs: readLegacyRuns(), warning: `Some saved runs could not be loaded from browser storage. ${reason}` }
  }

  let warning: string | undefined
  for (const { key, run } of legacyEntries) {
    try {
      await writeRun(database, run)
      // Keep the legacy copy until the IndexedDB transaction commits successfully.
      window.localStorage.removeItem(key)
    } catch {
      warning = "Some older saved runs could not be moved into browser storage and remain in their original location."
    }
  }

  try {
    const stored = await readAll(database)
    const runs = stored.filter(isSavedSimulationRun)
    return { runs, warning }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Browser storage is unavailable."
    return { runs: readLegacyRuns(), warning: `Saved runs could not be fully loaded. ${reason}` }
  }
}

export async function saveSimulationRun(run: SavedSimulationRun): Promise<void> {
  if (!isSavedSimulationRun(run)) throw new Error("This simulation result is incomplete and cannot be saved.")
  const database = await openDatabase()
  await writeRun(database, run)
}

export async function clearSavedSimulationRuns(): Promise<void> {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite")
    transaction.objectStore(STORE_NAME).clear()
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error || new Error("Could not clear saved simulations."))
    transaction.onabort = () => reject(transaction.error || new Error("Could not clear saved simulations."))
  })

  try {
    const storage = window.localStorage
    const keys: string[] = []
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index)
      if (key?.startsWith(LEGACY_KEY_PREFIX)) keys.push(key)
    }
    keys.forEach((key) => storage.removeItem(key))
  } catch {
    // The IndexedDB records are cleared; inaccessible legacy keys remain untouched.
  }
}

export function isStorageQuotaError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "QuotaExceededError"
    : isObject(error) && error.name === "QuotaExceededError"
}
