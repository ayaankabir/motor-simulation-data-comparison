import { PROJECT } from "@/lib/conditions"
import { Panel, SectionHeading } from "@/components/dashboard/ui"

export function About() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="About this project"
        title="Scope, provenance, and honesty"
        description="This dashboard is a reporting layer over stored simulation result files. It is intended to communicate exactly what the simulation does and does not represent."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="space-y-2 p-5">
          <h3 className="text-sm font-semibold text-foreground">What this is</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{PROJECT.scope}</p>
        </Panel>
        <Panel className="space-y-2 p-5">
          <h3 className="text-sm font-semibold text-foreground">Honesty statement</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{PROJECT.honesty}</p>
        </Panel>
        <Panel className="space-y-2 p-5">
          <h3 className="text-sm font-semibold text-foreground">Model Scope & Operating Envelope</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Demonstrates Krause stationary d-q reduced-order simulation under specific discrete operating perturbations (+10% stator resistance, +50% load, -10% voltage unbalance, BPFO bearing vibration, and 10% rotor asymmetry proxy). These represent discrete scenarios rather than an experimentally validated continuous operating envelope.
          </p>
        </Panel>
        <Panel className="space-y-2 p-5">
          <h3 className="text-sm font-semibold text-foreground">Verification & Self-Consistency</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {"Numerical consistency is verified via relative power balance (< 1e-6 residual), steady-state torque balance (Te - TL - Bω ≈ 0), solver convergence (RK45 tolerances rtol=1e-6, atol=1e-8), and agreement with analytical equivalent circuit calculations. These are internal mathematical verification checks, not physical motor validation."}
          </p>
        </Panel>
        <Panel className="space-y-2 p-5">
          <h3 className="text-sm font-semibold text-foreground">Parameter set</h3>
          <p className="font-mono text-sm text-foreground">{PROJECT.parameterSet}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{PROJECT.parameterNotes}</p>
        </Panel>
        <Panel className="space-y-2 p-5">
          <h3 className="text-sm font-semibold text-foreground">Data handling</h3>
          <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-muted-foreground">
            <li>Every displayed value is read directly from a stored result JSON file.</li>
            <li>Missing quantities render as an em-dash and are never replaced with a default.</li>
            <li>Metrics are cross-plotted only when reported for two or more conditions.</li>
            <li>Consistency checks are displayed as stored; they are not re-run here.</li>
          </ul>
        </Panel>
        <Panel className="space-y-3 border-border bg-muted/20 p-5">
          <h3 className="text-sm font-semibold text-foreground">Documented limitations</h3>
          <p className="text-sm leading-relaxed text-muted-foreground font-medium">
            Exploratory only — simulated data; generalization to real motors has not been validated.
          </p>
          <details className="rounded-lg border border-border/80 bg-background/40">
            <summary className="cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground marker:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              View detailed limitations
            </summary>
            <div className="space-y-2 px-3 pb-3 text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
              <p>The ML analysis uses a small simulated dataset. Its current record and scenario counts are reported by the backend at runtime.</p>
              <p>Each scenario maps to one class, so scenario/class confounding prevents a meaningful assessment of generalization to unseen scenarios. The generator uses one illustrative motor parameter basis with selected parameter variations.</p>
              <p>Reported metrics are training-set diagnostics, not independent validation. The project has no experimental validation and has not demonstrated real-world predictive-maintenance accuracy.</p>
            </div>
          </details>
        </Panel>
      </div>
    </div>
  )
}
