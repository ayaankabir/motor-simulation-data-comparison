import test from "node:test"
import assert from "node:assert/strict"
import { updateParameterOverride } from "./simulation-request.ts"

test("clearing an optional override removes it and omits an empty override map", () => {
  assert.deepEqual(updateParameterOverride({ rs: 2 }, "rs", ""), undefined)
  assert.deepEqual(updateParameterOverride({ rs: 2, rr: 3 }, "rs", ""), { rr: 3 })
})

test("an explicitly entered one remains a valid override", () => {
  assert.deepEqual(updateParameterOverride(undefined, "rs", "1"), { rs: 1 })
})

test("GET simulation query omits cleared overrides and preserves explicit values", async () => {
  const previousBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  const previousFetch = globalThis.fetch
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://simulation.test"
  let requestUrl = ""
  globalThis.fetch = async (input) => {
    requestUrl = String(input)
    return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } })
  }

  try {
    const { simulate } = await import("./api.ts")
    const cleared = updateParameterOverride({ rs: 2 }, "rs", "")
    await simulate.request({ scenario_name: "healthy", param_overrides: cleared })
    assert.equal(new URL(requestUrl).searchParams.has("param_overrides"), false)

    const explicit = updateParameterOverride(undefined, "rs", "1")
    await simulate.request({ scenario_name: "healthy", param_overrides: explicit })
    assert.equal(new URL(requestUrl).searchParams.get("param_overrides"), JSON.stringify({ rs: 1 }))
  } finally {
    globalThis.fetch = previousFetch
    if (previousBaseUrl === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL
    else process.env.NEXT_PUBLIC_API_BASE_URL = previousBaseUrl
  }
})
