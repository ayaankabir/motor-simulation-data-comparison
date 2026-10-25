import test from "node:test"
import assert from "node:assert/strict"

test("ML training sends POST to the backend endpoint and returns its result", async () => {
  const previousBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  const previousFetch = globalThis.fetch
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.test/"

  let requestUrl = ""
  let requestOptions
  const payload = {
    sklearn_available: true,
    model_trained: true,
    metrics: {
      training_accuracy: 0.9,
      training_macro_f1: 0.88,
      per_class_metrics: { healthy: { precision: 0.9, recall: 0.8, f1: 0.85, support: 10 } },
      confusion_matrix: [[8, 2], [1, 9]],
    },
    feature_importances: { torque: 0.6 },
    baseline_comparison: { dummy: { training_accuracy: 0.5 } },
    dataset_info: { n_records: 20, n_scenarios: 2 },
    warnings: ["Exploratory only"],
    limitations: ["No experimental validation"],
  }
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input)
    requestOptions = init
    return new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json" } })
  }

  try {
    const { ml } = await import("./api.ts")
    const result = await ml.train()

    assert.equal(requestUrl, "https://backend.test/api/ml/train")
    assert.equal(requestOptions.method, "POST")
    assert.equal(requestOptions.cache, "no-store")
    assert.equal(requestOptions.body, undefined)
    assert.equal(result.connected, true)
    assert.deepEqual(result.data, payload)
  } finally {
    globalThis.fetch = previousFetch
    if (previousBaseUrl === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL
    else process.env.NEXT_PUBLIC_API_BASE_URL = previousBaseUrl
  }
})

test("ML training exposes backend errors and network failures", async () => {
  const previousBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  const previousFetch = globalThis.fetch
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.test"

  try {
    const { ml } = await import("./api.ts")
    globalThis.fetch = async () => new Response(JSON.stringify({ detail: "Dataset approval required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
    const backendError = await ml.train()
    assert.equal(backendError.connected, false)
    assert.equal(backendError.error, "Dataset approval required")

    globalThis.fetch = async () => { throw new TypeError("Failed to fetch") }
    const networkError = await ml.train()
    assert.equal(networkError.connected, false)
    assert.equal(networkError.error, "Failed to fetch")
  } finally {
    globalThis.fetch = previousFetch
    if (previousBaseUrl === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL
    else process.env.NEXT_PUBLIC_API_BASE_URL = previousBaseUrl
  }
})
