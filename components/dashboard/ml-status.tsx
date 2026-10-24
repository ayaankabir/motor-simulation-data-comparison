"use client"

import { AlertCircle, Info } from "lucide-react"
import { Panel } from "@/components/dashboard/ui"
import type {
  ApiMLAnalyzeResponse,
  ApiMLModelResponse,
  ApiMLInterpretationResponse,
} from "@/lib/api"

type MLStatusProps = {
  analyze: ApiMLAnalyzeResponse
  model: ApiMLModelResponse
  interpretations: ApiMLInterpretationResponse
}

export function MLStatus({ analyze, model, interpretations }: MLStatusProps) {
  return (
    <Panel className="space-y-3 border-amber-500/25 bg-amber-500/[0.04] p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-300" aria-hidden />
        <div className="min-w-0 space-y-1">
          <h3 className="font-medium text-foreground">ML pipeline status: exploratory</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {analyze.records} simulated records across {analyze.scenarios} scenarios. Scenario/class confounding prevents a valid assessment of generalization to unseen scenarios.
          </p>
        </div>
      </div>
      <div className="grid gap-2 text-sm sm:grid-cols-3">
        <p className="rounded-md border border-border/70 bg-background/40 p-3 text-muted-foreground">
          Dataset analysis: {analyze.ready_for_ml ? "available" : "exploratory with limitations"}
        </p>
        <p className="rounded-md border border-border/70 bg-background/40 p-3 text-muted-foreground">
          Model configuration: {model.ready ? "dependencies/configuration available" : "not ready"}; API training is not provided.
        </p>
        <p className="rounded-md border border-border/70 bg-background/40 p-3 text-muted-foreground">
          Interpretation: built-in importance {interpretations.feature_importance.available ? "reported as available" : "unavailable"}; SHAP {interpretations.shap.available ? "available" : "unavailable"}.
        </p>
      </div>
      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        These API readiness indicators do not mean a classifier has been trained, independently validated, or shown to predict real equipment failures.
      </p>
    </Panel>
  )
}
