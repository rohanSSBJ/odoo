import type { ReactNode } from 'react'

/* ---------------------------------------------------------------------------
   Status badge — colored pill used across tables (vehicle/driver/trip status)
--------------------------------------------------------------------------- */
export type StatusTone =
  | 'available'
  | 'ontrip'
  | 'inshop'
  | 'retired'
  | 'completed'
  | 'dispatched'
  | 'draft'
  | 'cancelled'
  | 'offduty'
  | 'suspended'
  | 'pending'

const TONE_STYLES: Record<StatusTone, string> = {
  available: 'bg-[#28c840]/15 text-[#4ade80] border-[#28c840]/30',
  ontrip: 'bg-[#3D81E3]/15 text-[#7db3ff] border-[#3D81E3]/30',
  inshop: 'bg-[#f59e0b]/15 text-[#fbbf24] border-[#f59e0b]/30',
  retired: 'bg-[#ff5f57]/15 text-[#ff8a84] border-[#ff5f57]/30',
  completed: 'bg-[#28c840]/15 text-[#4ade80] border-[#28c840]/30',
  dispatched: 'bg-[#3D81E3]/15 text-[#7db3ff] border-[#3D81E3]/30',
  draft: 'bg-white/5 text-white/50 border-white/15',
  cancelled: 'bg-[#ff5f57]/15 text-[#ff8a84] border-[#ff5f57]/30',
  offduty: 'bg-[#f59e0b]/15 text-[#fbbf24] border-[#f59e0b]/30',
  suspended: 'bg-[#ff5f57]/15 text-[#ff8a84] border-[#ff5f57]/30',
  pending: 'bg-white/5 text-white/50 border-white/15',
}

export function StatusBadge({ tone, label }: { tone: StatusTone; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${TONE_STYLES[tone]}`}
    >
      {label}
    </span>
  )
}

/* ---------------------------------------------------------------------------
   Glass card wrapper
--------------------------------------------------------------------------- */
export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`liquid-glass rounded-xl ${className}`}>{children}</div>
  )
}

/* ---------------------------------------------------------------------------
   KPI stat card
--------------------------------------------------------------------------- */
export function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <Card className="p-4">
      <div className="text-[10px] uppercase tracking-widest text-white/40">{label}</div>
      <div
        className="mt-2 text-2xl font-semibold tracking-tight"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
    </Card>
  )
}

/* ---------------------------------------------------------------------------
   Page header with title + optional action
--------------------------------------------------------------------------- */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-white/50">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

/* ---------------------------------------------------------------------------
   Small amber/white pill action button
--------------------------------------------------------------------------- */
export function ActionButton({
  children,
  variant = 'amber',
  onClick,
  type = 'button',
}: {
  children: ReactNode
  variant?: 'amber' | 'white' | 'ghost'
  onClick?: () => void
  type?: 'button' | 'submit'
}) {
  const styles =
    variant === 'amber'
      ? 'bg-[#e0972a] text-black hover:bg-[#f0a838]'
      : variant === 'white'
        ? 'bg-white text-black hover:bg-white/90'
        : 'border border-white/15 text-white hover:bg-white/5'
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all active:scale-[0.98] ${styles}`}
    >
      {children}
    </button>
  )
}

/* ---------------------------------------------------------------------------
   Rule / callout note lines (business-rule hints from the wireframe)
--------------------------------------------------------------------------- */
export function RuleNote({ children, tone = 'amber' }: { children: ReactNode; tone?: 'amber' | 'muted' }) {
  return (
    <p className={`text-xs leading-relaxed ${tone === 'amber' ? 'text-[#e0972a]' : 'text-white/40'}`}>
      {children}
    </p>
  )
}

/* ---------------------------------------------------------------------------
   SectionCard — glass card with a title/description header
--------------------------------------------------------------------------- */
export function SectionCard({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={`p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title ? <div className="text-sm font-semibold">{title}</div> : null}
            {description ? (
              <div className="mt-0.5 text-xs text-white/40">{description}</div>
            ) : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </Card>
  )
}

/* ---------------------------------------------------------------------------
   Progress — labeled horizontal bar
--------------------------------------------------------------------------- */
export function Progress({
  value,
  max = 100,
  color = '#3D81E3',
  label,
  hint,
  height = 8,
}: {
  value: number
  max?: number
  color?: string
  label?: string
  hint?: string
  height?: number
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div>
      {(label || hint) && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-white/60">{label}</span>
          <span className="text-white/40">{hint}</span>
        </div>
      )}
      <div className="overflow-hidden rounded-full bg-white/5" style={{ height }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
   KeyValue — definition row (label left, value right)
--------------------------------------------------------------------------- */
export function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-2 last:border-0">
      <span className="text-xs text-white/45">{label}</span>
      <span className="text-sm text-white/85">{value}</span>
    </div>
  )
}

/* ---------------------------------------------------------------------------
   Pill — small rounded chip
--------------------------------------------------------------------------- */
export function Pill({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'default' | 'brand' | 'green' | 'amber' | 'red'
}) {
  const tones: Record<string, string> = {
    default: 'border-white/10 bg-white/[0.03] text-white/70',
    brand: 'border-[#3D81E3]/30 bg-[#3D81E3]/10 text-[#7db3ff]',
    green: 'border-[#28c840]/30 bg-[#28c840]/10 text-[#4ade80]',
    amber: 'border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#fbbf24]',
    red: 'border-[#ff5f57]/30 bg-[#ff5f57]/10 text-[#ff8a84]',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${tones[tone]}`}>
      {children}
    </span>
  )
}

/* ---------------------------------------------------------------------------
   Formula — monospace formula badge with a label
--------------------------------------------------------------------------- */
export function Formula({ label, expr }: { label?: string; expr: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
      {label ? (
        <div className="mb-1 text-[10px] uppercase tracking-widest text-white/35">{label}</div>
      ) : null}
      <code className="font-mono text-xs text-[#A4F4FD]">{expr}</code>
    </div>
  )
}

/* ---------------------------------------------------------------------------
   StateFlow — renders an enum state machine as chips + arrows
--------------------------------------------------------------------------- */
export function StateFlow({
  states,
}: {
  states: { label: string; tone: StatusTone; note?: string }[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {states.map((s, i) => (
        <span key={s.label} className="inline-flex items-center gap-2">
          <span className="inline-flex flex-col items-center">
            <StatusBadge tone={s.tone} label={s.label} />
            {s.note ? <span className="mt-1 text-[10px] text-white/35">{s.note}</span> : null}
          </span>
          {i < states.length - 1 ? <span className="text-white/25">→</span> : null}
        </span>
      ))}
    </div>
  )
}
