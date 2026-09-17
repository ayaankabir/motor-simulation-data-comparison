import { ChevronRight } from "lucide-react"

export function RawJson({ data, label = "Raw JSON (source of truth)" }: { data: unknown; label?: string }) {
  return (
    <details className="group rounded-xl border border-border bg-card/60">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden />
        {label}
      </summary>
      <div className="border-t border-border">
        <pre className="max-h-[28rem] overflow-auto px-4 py-3 font-mono text-xs leading-relaxed text-muted-foreground">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </details>
  )
}
