import type { Condition, HealthResponse, RawConditionRecord, RawConditionsResponse } from "@/lib/types"

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? ""

async function request<T>(path: string): Promise<T> {
  if (!API_BASE_URL) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured. Start the read-only FastAPI service and set the API URL.")
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: { Accept: "application/json" } })
  if (!response.ok) throw new Error(`API request failed (${response.status}) for ${path}`)
  return response.json() as Promise<T>
}

// The read-only service returns raw repository summaries wrapped as
// { condition_id, source_file, data }. The dashboard adapter in
// lib/conditions.ts maps these into the presentation Condition contract.
export const api = {
  health: () => request<HealthResponse>("/api/health"),
  conditions: async () => (await request<RawConditionsResponse>("/api/conditions")).conditions as RawConditionRecord[],
  condition: async (id: string) => request<{ condition_id: string; source_file: string; data: unknown }>(`/api/conditions/${encodeURIComponent(id)}`),
}

// ML API types
export interface ApiMLAnalyzeResponse {
  records: number
  classes: number
  scenarios: number
  class_distribution: Record<string, number>
  scenario_distribution: Record<string, number>
  scenario_class_mapping: Record<string, string[]>
  feature_stats: Record<string, { min: number; max: number; mean: number; std: number }>
  sklearn_available: boolean
  limitations: string[]
  warnings: string[]
  ready_for_ml: boolean
}

export interface ApiMLAnalyze {
  connected: boolean
  error?: string
  data?: ApiMLAnalyzeResponse
}

export interface ApiMLModelConfig {
  n_estimators: number
  max_depth: number | null
  min_samples_split: number
  min_samples_leaf: number
  random_state: number
  n_jobs: number
  class_weight: string | null
  scale_features: boolean
  feature_columns: string[]
  target_column: string
  group_column: string
  cv_strategy: string
  require_provenance: boolean
  allowed_labels: string[]
  output_dir: string | null
}

export interface ApiMLModelResponse {
  sklearn_available: boolean
  model_type: string
  config: ApiMLModelConfig
  feature_columns: string[]
  target_column: string
  group_column: string
  n_estimators: number
  max_depth: number | null
  scale_features: boolean
  class_weight: string
  cv_strategy: string
  ready: boolean
  message: string
}

export interface ApiMLModel {
  connected: boolean
  error?: string
  data?: ApiMLModelResponse
}

export interface ApiMLInterpretationFeatureImportance {
  builtin: boolean
  description: string
  available: boolean
}

export interface ApiMLInterpretationSHAP {
  available: boolean
  message: string
}

export interface ApiMLInterpretationLimitations {
  scenario_class_confounding: boolean
  single_parameter_set: boolean
  no_valid_held_out: boolean
  exploratory_only: boolean
}

export interface ApiMLInterpretationResponse {
  feature_importance: ApiMLInterpretationFeatureImportance
  shap: ApiMLInterpretationSHAP
  limitations: ApiMLInterpretationLimitations
  message: string
}

export interface ApiMLInterpretations {
  connected: boolean
  error?: string
  data?: ApiMLInterpretationResponse
}

export interface ApiMLTrainingResponse {
  sklearn_available: boolean
  model_trained: boolean
  model_type?: string
  training_mode?: string
  dataset_info?: {
    records?: Record<string, number>
    n_records?: number
    n_scenarios?: number
  }
  metrics?: {
    training_accuracy?: number
    training_macro_f1?: number
    per_class_metrics?: Record<string, { precision: number; recall: number; f1: number; support: number }>
    confusion_matrix?: number[][]
    classification_report?: string
    note?: string
  }
  feature_importances?: Record<string, number>
  baseline_comparison?: Record<string, unknown>
  warnings?: string[]
  limitations?: string[]
  message?: string
}

export interface ApiMLTraining {
  connected: boolean
  error?: string
  data?: ApiMLTrainingResponse
}

export const ml = {
  analyze: async (): Promise<ApiMLAnalyze> => {
    const unavailable = apiUnavailableMessage()
    if (unavailable) return { connected: false, error: unavailable }
    try {
      const response = await fetch(`${API_BASE_URL}/api/ml/analyze`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        cache: "no-store",
      })
      if (!response.ok) {
        return { connected: false, error: await responseError(response, `ML analysis failed (${response.status})`) }
      }
      return { connected: true, data: await response.json() as ApiMLAnalyzeResponse }
    } catch (error) {
      return { connected: false, error: error instanceof Error ? error.message : "ML analysis request failed" }
    }
  },

  model: async (): Promise<ApiMLModel> => {
    const unavailable = apiUnavailableMessage()
    if (unavailable) return { connected: false, error: unavailable }
    try {
      const response = await fetch(`${API_BASE_URL}/api/ml/model`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      })
      if (!response.ok) {
        return { connected: false, error: await responseError(response, `ML model request failed (${response.status})`) }
      }
      return { connected: true, data: await response.json() as ApiMLModelResponse }
    } catch (error) {
      return { connected: false, error: error instanceof Error ? error.message : "ML model request failed" }
    }
  },

  interpretations: async (): Promise<ApiMLInterpretations> => {
    const unavailable = apiUnavailableMessage()
    if (unavailable) return { connected: false, error: unavailable }
    try {
      const response = await fetch(`${API_BASE_URL}/api/ml/interpretations`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      })
      if (!response.ok) {
        return { connected: false, error: await responseError(response, `ML interpretations failed (${response.status})`) }
      }
      return { connected: true, data: await response.json() as ApiMLInterpretationResponse }
    } catch (error) {
      return { connected: false, error: error instanceof Error ? error.message : "ML interpretations request failed" }
    }
  },

  train: async (): Promise<ApiMLTraining> => {
    const unavailable = apiUnavailableMessage()
    if (unavailable) return { connected: false, error: unavailable }
    try {
      const response = await fetch(`${API_BASE_URL}/api/ml/train`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        cache: "no-store",
      })
      if (!response.ok) {
        return { connected: false, error: await responseError(response, `ML training failed (${response.status})`) }
      }
      return { connected: true, data: await response.json() as ApiMLTrainingResponse }
    } catch (error) {
      return { connected: false, error: error instanceof Error ? error.message : "ML training request failed" }
    }
  },
}

// Simulation endpoints use the backend's GET/query-parameter contract.
export interface SimulateRequest {
  scenario_name: string
  t_end?: number
  max_step?: number
  output_dt?: number
  rtol?: number
  atol?: number
  noise_seed?: number
  param_overrides?: Record<string, number>
  mqtt_chunk_size?: number
  mqtt_enabled?: boolean
}

export interface SimulateMetadata {
  label: string
  provenance: string
  parameter_provenance: string
  park_convention: string
  solver: string
  max_step_s: number
  rtol: number
  atol: number
  t_end_s: number
  output_dt_s: number
  initial_condition: string
  nfev: number
  njev: number
  n_eval: number
  message: string
  supply_frequency_hz: number
  load_type: string
  load_torque_nm: number
  stator_resistance_case: string
  experimental_validation: boolean
}

export interface SimulateSample {
  time_s: number
  current_a: number
}

export interface SimulateOutputs {
  three_phase_currents_a: SimulateSample[]
  three_phase_currents_b: SimulateSample[]
  three_phase_currents_c: SimulateSample[]
  qd0_currents_a: SimulateSample[]
  qd0_currents_b: SimulateSample[]
  omega_m?: SimulateSample[]
  tau_e?: SimulateSample[]
  tau_l?: SimulateSample[]
  lambda_qs?: SimulateSample[]
  lambda_ds?: SimulateSample[]
  i_qs?: SimulateSample[]
  [key: string]: SimulateSample[] | undefined
}

export interface MQTTStreamingReport {
  total_packets_received: number
  duplicate_count: number
  gap_count: number
  out_of_order_count: number
  malformed_count: number
  min_seq: number
  max_seq: number
  missing_sequences: number[]
}

export interface SimulateResponse {
  scenario_name: string
  t_end_s: number
  outputs: SimulateOutputs
  metadata: SimulateMetadata
  mqtt_streaming_report?: Record<string, MQTTStreamingReport>
}

export interface SimulateLimits {
  t_end: { min: number; max: number; default: number; unit: string }
  max_step: { min: number; max: number; default: number; unit: string }
  output_dt: { min: number; max: number; default: number; unit: string }
  rtol: { min: number; max: number; default: number }
  atol: { min: number; max: number; default: number }
  y0: { default: number[]; description: string }
  param_overrides: { valid_keys: string[]; description: string }
  noise_seed: { description: string }
  scenario: { description: string; available: string[] }
  provenance: {
    always_simulated: boolean
    parameter_provenance_literature_example: boolean
    experimental_validation: boolean
  }
  mqtt_chunk_size: { min: number; max: number; default: number; unit: string }
  mqtt_streaming: { description: string }
}

export interface ApiResult<T> {
  connected: boolean
  data?: T
  error?: string
}

async function responseError(response: Response, fallback: string): Promise<string> {
  const body = await response.text()
  if (body) {
    try {
      const parsed: unknown = JSON.parse(body)
      if (typeof parsed === "object" && parsed !== null && "detail" in parsed) {
        const detail = (parsed as { detail?: unknown }).detail
        if (typeof detail === "string") return detail
      }
    } catch {
      // The backend may return a plain-text or HTML error body.
    }
    return body.slice(0, 300)
  }
  return fallback
}

function apiUnavailableMessage(): string | null {
  return API_BASE_URL
    ? null
    : "NEXT_PUBLIC_API_BASE_URL is not configured. Start the read-only FastAPI service and set the API URL."
}

export const simulate = {
  limits: async (): Promise<ApiResult<SimulateLimits>> => {
    const unavailable = apiUnavailableMessage()
    if (unavailable) return { connected: false, error: unavailable }
    try {
      const response = await fetch(`${API_BASE_URL}/api/simulate/limits`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      })
      if (!response.ok) {
        return {
          connected: false,
          error: await responseError(response, `Failed to load simulation limits (${response.status})`),
        }
      }
      return { connected: true, data: await response.json() as SimulateLimits }
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : "Failed to load simulation limits",
      }
    }
  },

  request: async (request: SimulateRequest): Promise<ApiResult<SimulateResponse>> => {
    const unavailable = apiUnavailableMessage()
    if (unavailable) return { connected: false, error: unavailable }
    const params = new URLSearchParams({ scenario_name: request.scenario_name })
    for (const key of ["t_end", "max_step", "output_dt", "rtol", "atol", "noise_seed"] as const) {
      const value = request[key]
      if (value !== undefined) params.set(key, String(value))
    }
    if (request.param_overrides) params.set("param_overrides", JSON.stringify(request.param_overrides))
    if (request.mqtt_enabled !== undefined) params.set("mqtt_enabled", String(request.mqtt_enabled))
    if (request.mqtt_chunk_size !== undefined) params.set("mqtt_chunk_size", String(request.mqtt_chunk_size))

    try {
      const response = await fetch(`${API_BASE_URL}/api/simulate?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      })
      if (!response.ok) {
        return {
          connected: false,
          error: await responseError(response, `Simulation failed (${response.status})`),
        }
      }
      return { connected: true, data: await response.json() as SimulateResponse }
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : "Simulation failed",
      }
    }
  },
}
