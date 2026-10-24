import test from "node:test"
import assert from "node:assert/strict"
import { isSavedSimulationRun, isStorageQuotaError, parseLegacySimulationRun } from "./simulation-storage.ts"

const legacyValue = {
  params: { scenario_name: "healthy", t_end: 1 },
  response: {
    scenario_name: "healthy",
    t_end_s: 1,
    outputs: { three_phase_currents_a: [{ time_s: 0, current_a: 0 }] },
    metadata: { provenance: "simulated" },
  },
}

test("migrates a valid legacy run and derives its timestamp from the app-owned key", () => {
  const run = parseLegacySimulationRun("healthy_1792659400432", JSON.stringify(legacyValue))
  assert.ok(run)
  assert.equal(run.id, "healthy_1792659400432")
  assert.equal(run.status, "success")
  assert.equal(run.timestamp, new Date(1792659400432).toISOString())
  assert.equal(run.response.outputs.three_phase_currents_a.length, 1)
})

test("ignores malformed legacy JSON and incomplete records safely", () => {
  assert.equal(parseLegacySimulationRun("bad", "{"), null)
  assert.equal(parseLegacySimulationRun("bad", JSON.stringify({ params: {}, response: {} })), null)
  assert.equal(isSavedSimulationRun({ ...legacyValue, id: "bad", timestamp: "not-a-date", status: "success" }), false)
  assert.equal(parseLegacySimulationRun("bad", JSON.stringify({
    ...legacyValue,
    response: {
      ...legacyValue.response,
      outputs: { three_phase_currents_a: [null] },
    },
  })), null)
})

test("identifies browser quota errors for non-blocking save feedback", () => {
  assert.equal(isStorageQuotaError(new DOMException("full", "QuotaExceededError")), true)
  assert.equal(isStorageQuotaError(new Error("other failure")), false)
})
