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
      </div>
    </div>
  )
}
