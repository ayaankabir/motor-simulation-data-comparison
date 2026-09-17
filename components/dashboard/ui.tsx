import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { CATEGORIES, type CategoryId } from "@/lib/conditions"

export function Panel({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/60 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description?: string
}) {
  return (
    <div className="space-y-1.5">
      {eyebrow ? (
        <p className="text-xs font-medium uppercase tracking-widest text-primary/80">{eyebrow}</p>
      ) : null}
      <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  )
}

export function CategoryBadge({ category, className }: { category: CategoryId; className?: string }) {
  const meta = CATEGORIES[category]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        meta.tone,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {meta.label}
    </span>
  )
}

export function Tag({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode
  tone?: "neutral" | "ok" | "info"
  className?: string
}) {
  const tones: Record<string, string> = {
    neutral: "text-muted-foreground bg-muted/60 border-border",
    ok: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
    info: "text-sky-300 bg-sky-500/10 border-sky-500/30",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
