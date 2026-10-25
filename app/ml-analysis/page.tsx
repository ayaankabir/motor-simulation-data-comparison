"use client"

import { useState, useEffect, useCallback } from "react"
import { BrainCircuit, AlertCircle, CheckCircle, BarChart3, Database, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ml,
  type ApiMLAnalyzeResponse,
  type ApiMLModelResponse,
  type ApiMLInterpretationResponse,
  type ApiMLTrainingResponse,
} from "@/lib/api"
import { MLStatus } from "@/components/dashboard/ml-status"
import { Panel, SectionHeading } from "@/components/dashboard/ui"

export default function MLAnalysisPage() {
  const [analyze, setAnalyze] = useState<ApiMLAnalyzeResponse | null>(null)
  const [model, setModel] = useState<ApiMLModelResponse | null>(null)
  const [interpretations, setInterpretations] = useState<ApiMLInterpretationResponse | null>(null)
  const [training, setTraining] = useState<ApiMLTrainingResponse | null>(null)
  const [trainingLoading, setTrainingLoading] = useState(false)
  const [trainingError, setTrainingError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [analyzeRes, modelRes, interpRes] = await Promise.all([
        ml.analyze(),
        ml.model(),
        ml.interpretations(),
      ])

      if (!analyzeRes.connected) throw new Error(analyzeRes.error || "Dataset analysis endpoint unavailable")
      if (!modelRes.connected) throw new Error(modelRes.error || "Model endpoint unavailable")
      if (!interpRes.connected) throw new Error(interpRes.error || "Interpretations endpoint unavailable")

      setAnalyze(analyzeRes.data || null)
      setModel(modelRes.data || null)
      setInterpretations(interpRes.data || null)
    } catch (e: any) {
      setError(e.message || "Failed to load ML analysis data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTrain = useCallback(async () => {
    setTrainingLoading(true)
    setTrainingError(null)
    setTraining(null)
    try {
      const trainRes = await ml.train()
      if (!trainRes.connected) {
        throw new Error(trainRes.error || "ML training endpoint unavailable")
      }
      if (!trainRes.data) throw new Error("ML training returned no result")
      setTraining(trainRes.data)
    } catch (e: any) {
      setTrainingError(e.message || "Failed to run exploratory training")
    } finally {
      setTrainingLoading(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Panel className="flex items-center justify-center py-20">
          <RefreshCw className="size-8 animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">Loading ML analysis from backend...</span>
        </Panel>
      </div>
    )
  }

  if (error || !analyze || !model || !interpretations) {
    return (
      <div className="space-y-6">
        <Panel className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <AlertCircle className="mx-auto size-8 text-rose-400" />
          <h2 className="mt-2 text-base font-semibold text-rose-200">ML Analysis Unavailable</h2>
          <p className="mt-1 text-sm text-rose-300">{error || "Failed to load ML data from backend"}</p>
          <button
            type="button"
            onClick={fetchData}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/30 transition-colors"
          >
            <RefreshCw className="size-4" /> Retry
          </button>
        </Panel>
        <Panel className="border-amber-500/25 bg-amber-500/[0.05] p-4">
          <p className="text-sm leading-relaxed text-amber-100">
            Exploratory only: the dataset contains 48 simulated records across six scenarios with scenario/class confounding. Training-set scores do not establish generalization to unseen scenarios or real motors, and no experimental validation is implied.
          </p>
        </Panel>
        <TrainingAction onTrain={handleTrain} loading={trainingLoading} />
        <TrainingResults training={training} error={trainingError} />
      </div>
    )
  }

  const ready = analyze.ready_for_ml

  return (
    <div className="space-y-6">
      {/* Permanent disclaimer */}
      <Panel className="border-amber-500/25 bg-amber-500/[0.06] p-3 sm:p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-200/90 [overflow-wrap:anywhere]">
          Exploratory only — simulated data; generalization to real motors has not been validated.
        </p>
      </Panel>

      {/* Shared ML status summary; detailed dataset analysis follows below. */}
      <MLStatus analyze={analyze} model={model} interpretations={interpretations} />

      {/* Dataset Analysis */}
      <SectionHeading
        eyebrow="Dataset"
        title="Dataset analysis"
        description={ready
          ? "Dataset is ready for ML with documented limitations."
          : "Dataset has scenario=class confounding — each scenario maps to exactly one class."}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="space-y-4 p-5">
          <h3 className="text-sm font-semibold text-foreground">Class Distribution</h3>
          <div className="space-y-2">
            {Object.entries(analyze.class_distribution)
              .sort(([, a], [, b]) => b - a)
              .map(([cls, count]) => (
                <div key={cls} className="flex items-center gap-3">
                  <span className="w-32 text-sm font-medium text-foreground">{cls}</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(count / analyze.records) * 100}%` }}
                    />
                  </div>
                  <span className="w-16 text-sm text-muted-foreground text-right">
                    {count} ({(count / analyze.records * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
          </div>
        </Panel>

        <Panel className="space-y-4 p-5">
          <h3 className="text-sm font-semibold text-foreground">Scenario Distribution</h3>
          <div className="space-y-2">
            {Object.entries(analyze.scenario_distribution)
              .sort(([, a], [, b]) => b - a)
              .map(([scenario, count]) => (
                <div key={scenario} className="flex items-center gap-3">
                  <span className="w-48 text-xs font-medium text-foreground truncate">{scenario}</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${(count / analyze.records) * 100}%` }}
                    />
                  </div>
                  <span className="w-16 text-sm text-muted-foreground text-right">{count}</span>
                </div>
              ))}
          </div>
        </Panel>
      </div>

      {/* Feature Statistics */}
      <Panel className="space-y-4 p-5">
        <h3 className="text-sm font-semibold text-foreground">Feature Statistics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 font-medium">Feature</th>
                <th className="pb-2 font-medium text-right">Min</th>
                <th className="pb-2 font-medium text-right">Max</th>
                <th className="pb-2 font-medium text-right">Mean</th>
                <th className="pb_2 font-medium text-right">Std</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analyze.feature_stats).map(([feat, stats]) => (
                <tr key={feat} className="border-b border-border/50">
                  <td className="py-2 font-medium text-foreground">{feat}</td>
                  <td className="py-2 text-right text-muted-foreground">{stats.min.toExponential(3)}</td>
                  <td className="py-2 text-right text-muted-foreground">{stats.max.toExponential(3)}</td>
                  <td className="py-2 text-right text-muted-foreground">{stats.mean.toExponential(3)}</td>
                  <td className="py-2 text-right text-muted-foreground">{stats.std.toExponential(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Limitations */}
      <SectionHeading
        eyebrow="Limitations"
        title="Documented limitations"
        description="These limitations are inherent to the dataset and cannot be resolved without additional data or experimental validation."
      />

      <Panel className="space-y-3 border-border bg-card/60 p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          The returned dataset contains {analyze.records} simulated records across {analyze.scenarios} scenarios. Each scenario maps to one class, so this dataset does not establish generalization to unseen scenarios. It uses one illustrative motor parameter basis with selected operating and fault parameter variations. Reported metrics are exploratory training-set diagnostics, not independent validation.
        </p>
        <details className="text-sm leading-relaxed text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">View detailed limitations and notes</summary>
          <div className="mt-3 space-y-3">
            {analyze.limitations.length > 0 && (
              <ul className="list-disc space-y-2 pl-5 marker:text-muted-foreground">
                {analyze.limitations.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            )}
            {analyze.warnings.length > 0 && (
              <ul className="list-disc space-y-2 pl-5 marker:text-muted-foreground">
                {analyze.warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              Backend wording note: the API currently reports a single parameter set, while the dataset generator defines selected parameter-variation pools. Treat that API wording as stale pending a separate backend correction.
            </p>
          </div>
        </details>
      </Panel>

      {/* Model Configuration */}
      <SectionHeading
        eyebrow="Model"
        title="Random Forest configuration"
        description="Run exploratory training to calculate training-set diagnostics. These scores are not independent validation or real-world performance."
      />

      <TrainingAction onTrain={handleTrain} loading={trainingLoading} />

      <Panel className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {model && [
            { label: "Model type", value: model.model_type },
            { label: "Estimators (n_estimators)", value: (model.n_estimators ?? model.config.n_estimators).toString() },
            { label: "Max depth", value: (model.max_depth ?? model.config.max_depth)?.toString() || "None (unlimited)" },
            { label: "Min samples split", value: model.config.min_samples_split.toString() },
            { label: "Min samples leaf", value: model.config.min_samples_leaf.toString() },
            { label: "Random state", value: model.config.random_state.toString() },
            { label: "Class weight", value: model.class_weight ?? model.config.class_weight },
            { label: "Scale features", value: (model.scale_features ?? model.config.scale_features) ? "Yes" : "No" },
            { label: "CV strategy", value: model.cv_strategy ?? model.config.cv_strategy },
            { label: "Features", value: (model.feature_columns ?? model.config.feature_columns).join(", ") },
            { label: "Target column", value: model.target_column ?? model.config.target_column },
            { label: "Group column", value: model.group_column ?? model.config.group_column },
          ].map((item, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-sm font-mono text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Interpretation */}
      <SectionHeading
        eyebrow="Interpretation"
        title="Feature importance and SHAP"
        description="Built-in feature importances are available. SHAP requires additional dependencies."
      />

      <Panel className="space-y-4 p-5">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Built-in Feature Importances
          </h4>
          <p className="text-sm text-muted-foreground">
            Feature importances are shown with the exploratory training results below. They describe the fitted model and do not establish real-world predictive performance.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            SHAP Explanations
          </h4>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {interpretations?.shap.message || "SHAP not available"}
            </p>
          </div>
        </div>
      </Panel>

      <TrainingResults training={training} error={trainingError} />

    </div>
  )
}

function TrainingAction({ onTrain, loading }: { onTrain: () => void; loading: boolean }) {
  return (
    <Panel className="space-y-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Exploratory training</h2>
          <p className="text-xs text-muted-foreground">Reported scores are training-set metrics, not independent validation.</p>
        </div>
        <button
          type="button"
          onClick={onTrain}
          disabled={loading}
          aria-busy={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <BarChart3 className="size-4" aria-hidden="true" />}
          {loading ? "Running exploratory training…" : "Run Exploratory Training"}
        </button>
      </div>
    </Panel>
  )
}

function TrainingResults({ training, error }: { training: ApiMLTrainingResponse | null; error: string | null }) {
  if (!training && !error) return null

  const classMetrics = training?.metrics?.per_class_metrics
  const confusionMatrix = training?.metrics?.confusion_matrix
  const datasetDetails = training?.dataset_info

  return (
    <section className="space-y-4" aria-live="polite" aria-busy="false">
      <SectionHeading
        eyebrow="Training Results"
        title="Exploratory training output"
        description="All reported scores are from the training set. They are not independent validation or estimates of real-world performance."
      />

      {error && (
        <div role="alert">
          <Panel className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
            <AlertCircle className="mx-auto size-8 text-rose-400" aria-hidden="true" />
            <h3 className="mt-2 text-base font-semibold text-rose-200">Training failed</h3>
            <p className="mt-1 text-sm text-rose-300">{error}</p>
          </Panel>
        </div>
      )}

      {training && (
        <div className="space-y-4">
          {training.message && <p className="text-sm text-muted-foreground">{training.message}</p>}
          {!training.model_trained && (
            <Panel className="border-border bg-card/60 p-4">
              <p className="text-sm font-medium text-foreground">Training did not produce a fitted model.</p>
              <p className="mt-1 text-sm text-muted-foreground">No training scores or feature importances are presented for this response.</p>
            </Panel>
          )}
          {training.model_trained && training.metrics && (
            <Panel className="space-y-4 p-5">
              <h3 className="text-sm font-semibold text-foreground">Training-set metrics</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {training.metrics.training_accuracy !== undefined && (
                  <div className="rounded-lg bg-primary/5 p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{formatPercent(training.metrics.training_accuracy)}</p>
                    <p className="text-xs text-muted-foreground">Training-set accuracy</p>
                  </div>
                )}
                {training.metrics.training_macro_f1 !== undefined && (
                  <div className="rounded-lg bg-primary/5 p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{formatPercent(training.metrics.training_macro_f1)}</p>
                    <p className="text-xs text-muted-foreground">Training-set macro F1</p>
                  </div>
                )}
              </div>

              {classMetrics && Object.keys(classMetrics).length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground">Per-class training-set metrics</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th scope="col" className="pb-2 font-medium">Class</th>
                          <th scope="col" className="pb-2 text-right font-medium">Precision</th>
                          <th scope="col" className="pb-2 text-right font-medium">Recall</th>
                          <th scope="col" className="pb-2 text-right font-medium">F1</th>
                          <th scope="col" className="pb-2 text-right font-medium">Training support</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(classMetrics).map(([label, metrics]) => (
                          <tr key={label} className="border-b border-border/50">
                            <th scope="row" className="py-2 text-left font-medium text-foreground">{label}</th>
                            <td className="py-2 text-right text-muted-foreground">{metrics.precision.toFixed(3)}</td>
                            <td className="py-2 text-right text-muted-foreground">{metrics.recall.toFixed(3)}</td>
                            <td className="py-2 text-right text-muted-foreground">{metrics.f1.toFixed(3)}</td>
                            <td className="py-2 text-right text-muted-foreground">{metrics.support}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {training.metrics.note && <p className="text-xs text-muted-foreground">{training.metrics.note}</p>}
            </Panel>
          )}

          {training.model_trained && confusionMatrix && confusionMatrix.length > 0 && (
            <Panel className="space-y-3 p-5">
              <h3 className="text-sm font-semibold text-foreground">Confusion matrix (training set)</h3>
              <p className="text-xs text-muted-foreground">Rows are actual classes and columns are predicted classes. The API returns this matrix in class order; positional labels are used here.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Training-set confusion matrix, rows actual and columns predicted</caption>
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th scope="col" className="p-2 text-left font-medium">Actual / Predicted</th>
                      {confusionMatrix[0]?.map((_, index) => (
                        <th scope="col" key={index} className="p-2 text-right font-medium">Predicted {index + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {confusionMatrix.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-border/50">
                        <th scope="row" className="p-2 text-left font-medium text-foreground">Actual {rowIndex + 1}</th>
                        {row.map((count, columnIndex) => (
                          <td key={columnIndex} className="p-2 text-right font-mono text-muted-foreground">{count}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {training.model_trained && training.feature_importances && Object.keys(training.feature_importances).length > 0 && (
            <Panel className="space-y-4 p-5">
              <h3 className="text-sm font-semibold text-foreground">Feature importances (training set)</h3>
              <div className="space-y-2">
                {Object.entries(training.feature_importances).sort(([, a], [, b]) => b - a).map(([feature, importance]) => (
                  <div key={feature} className="flex items-center gap-3">
                    <span className="w-48 truncate text-sm font-medium text-foreground">{feature}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${Math.max(0, Math.min(importance * 100, 100))}%` }} />
                    </div>
                    <span className="w-16 text-right text-sm text-muted-foreground">{(importance * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {training.model_trained && training.baseline_comparison && Object.keys(training.baseline_comparison).length > 0 && (
            <Panel className="space-y-3 p-5">
              <h3 className="text-sm font-semibold text-foreground">Baseline comparisons (training set)</h3>
              <p className="text-xs text-muted-foreground">Baseline scores are training-set diagnostics and are not independent validation.</p>
              <pre className="overflow-x-auto rounded bg-muted/50 p-3 text-xs text-muted-foreground">{JSON.stringify(training.baseline_comparison, null, 2)}</pre>
            </Panel>
          )}

          {training.limitations && training.limitations.length > 0 && (
            <Panel className="space-y-3 border-border bg-card/60 p-5">
              <h3 className="text-sm font-semibold text-foreground">Documented limitations</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                {training.limitations.map((limitation, index) => <li key={index}>{limitation}</li>)}
              </ul>
            </Panel>
          )}

          {training.warnings && training.warnings.length > 0 && (
            <Panel className="space-y-3 border-amber-500/25 bg-amber-500/[0.04] p-5">
              <h3 className="text-sm font-semibold text-amber-200">Training warnings</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                {training.warnings.map((warning, index) => <li key={index}>{warning}</li>)}
              </ul>
            </Panel>
          )}

          {datasetDetails && (
            <Panel className="space-y-3 p-5">
              <h3 className="text-sm font-semibold text-foreground">Training dataset details</h3>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {Object.entries(datasetDetails).map(([key, value]) => (
                  <div key={key} className="flex min-w-0 justify-between gap-3 border-b border-border/40 py-1">
                    <dt className="text-muted-foreground">{formatLabel(key)}</dt>
                    <dd className="break-all text-right font-mono text-foreground">{formatValue(value)}</dd>
                  </div>
                ))}
                {training.training_mode && (
                  <div className="flex min-w-0 justify-between gap-3 border-b border-border/40 py-1">
                    <dt className="text-muted-foreground">Training mode</dt>
                    <dd className="break-all text-right font-mono text-foreground">{training.training_mode}</dd>
                  </div>
                )}
              </dl>
            </Panel>
          )}
        </div>
      )}
    </section>
  )
}

function formatPercent(value: number) {
  const percentage = value <= 1 ? value * 100 : value
  return `${percentage.toFixed(1)}%`
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "N/A"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function PipelineStatusCard({
  title,
  icon: Icon,
  ready,
  status,
  message,
  children,
}: {
  title: string
  icon: typeof BrainCircuit
  ready: boolean
  status: "ready" | "partial" | "error"
  message: string
  children: React.ReactNode
}) {
  return (
    <Panel className={cn(
      "p-4",
      status === "ready" && "border-green-500/25 bg-green-500/[0.05]",
      status === "partial" && "border-amber-500/25 bg-amber-500/[0.05]",
      status === "error" && "border-rose-500/25 bg-rose-500/[0.05]",
    )}>
      <div className="flex items-start gap-2.5">
        <Icon
          className={cn(
            "size-4.5 flex-shrink-0",
            status === "ready" && "text-green-400",
            status === "partial" && "text-amber-400",
            status === "error" && "text-rose-400",
          )}
        />
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-[9px] font-medium uppercase tracking-widest",
            status === "ready" && "text-green-300",
            status === "partial" && "text-amber-300",
            status === "error" && "text-rose-300",
          )}>
            {title}
          </p>
          <p className="text-[9px] text-muted-foreground">
            {message}
          </p>
        </div>
        <div className={cn(
          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium",
          status === "ready" && "bg-green-500/10 text-green-300",
          status === "partial" && "bg-amber-500/10 text-amber-300",
          status === "error" && "bg-rose-500/10 text-rose-300",
        )}>
          {status === "ready" && <CheckCircle className="size-2.5" />}
          {status === "partial" && <AlertCircle className="size-2.5" />}
          {status === "error" && <XCircle className="size-2.5" />}
          {status === "ready" && "Ready"}
          {status === "partial" && "Partial"}
          {status === "error" && "Error"}
        </div>
      </div>
    </Panel>
  )
}

function XCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}
