import { motion } from 'motion/react'
import { AlertTriangle, ShieldAlert, Wrench, Ban, TrendingUp, ArrowUpRight } from 'lucide-react'
import { Card, PageHeader, StatusBadge, SectionCard, Progress, Pill } from '../ui'
import type { StatusTone } from '../ui'

const KPIS = [
  { label: 'Active Vehicles', value: '53', hint: 'ON_TRIP + AVAILABLE' },
  { label: 'Available Vehicles', value: '42', hint: 'in dispatch pool' },
  { label: 'In Maintenance', value: '05', hint: 'IN_SHOP', accent: '#fbbf24' },
  { label: 'Active Trips', value: '18', hint: 'DISPATCHED' },
  { label: 'Pending Trips', value: '09', hint: 'DRAFT' },
  { label: 'Drivers on Duty', value: '26', hint: 'ON_TRIP' },
  { label: 'Fleet Utilization', value: '81%', hint: 'on-trip / operational', accent: '#4ade80' },
]

const RECENT_TRIPS: {
  trip: string
  route: string
  vehicle: string
  driver: string
  cargo: string
  tone: StatusTone
  status: string
  eta: string
}[] = [
  { trip: 'TR001', route: 'Gandhinagar → Ahmedabad', vehicle: 'VAN-05', driver: 'Alex', cargo: '480 / 500 kg', tone: 'ontrip', status: 'On Trip', eta: '45 min' },
  { trip: 'TR002', route: 'Vatva → Sanand', vehicle: 'TRK-12', driver: 'John', cargo: '3.2 / 5 T', tone: 'completed', status: 'Completed', eta: 'Delivered' },
  { trip: 'TR003', route: 'Kalol → Mehsana', vehicle: 'MINI-08', driver: 'Priya', cargo: '820 / 1000 kg', tone: 'dispatched', status: 'Dispatched', eta: '1h 10m' },
  { trip: 'TR006', route: 'Maroa → Kalol Depot', vehicle: '—', driver: '—', cargo: '— ', tone: 'draft', status: 'Draft', eta: 'Awaiting vehicle' },
]

const VEHICLE_STATUS = [
  { label: 'Available', value: 42, total: 60, color: '#28c840' },
  { label: 'On Trip', value: 18, total: 60, color: '#3D81E3' },
  { label: 'In Shop', value: 5, total: 60, color: '#f59e0b' },
  { label: 'Retired', value: 3, total: 60, color: '#ff5f57' },
]

const DRIVER_STATUS = [
  { label: 'Available', value: 19, total: 48, color: '#28c840' },
  { label: 'On Trip', value: 26, total: 48, color: '#3D81E3' },
  { label: 'Off Duty', value: 2, total: 48, color: '#f59e0b' },
  { label: 'Suspended', value: 1, total: 48, color: '#ff5f57' },
]

const ALERTS = [
  { icon: ShieldAlert, tone: 'red' as const, title: '1 driver license expired', detail: 'John (DL-4420) — blocked from all trip assignment.' },
  { icon: AlertTriangle, tone: 'amber' as const, title: '3 licenses expiring in 30 days', detail: 'Safety Officer notified · renewal reminders queued.' },
  { icon: Wrench, tone: 'amber' as const, title: '5 vehicles In Shop', detail: 'Removed from the dispatch pool until maintenance closes.' },
  { icon: Ban, tone: 'red' as const, title: '2 dispatches blocked today', detail: 'Cargo over capacity (1) · already ON_TRIP (1).' },
]

export function Dashboard() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Operations Dashboard"
        subtitle="Live fleet, driver, and trip state — every transition enforced by the service layer."
        action={<Pill tone="brand"><TrendingUp className="w-3.5 h-3.5" /> Real-time system of record</Pill>}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {KPIS.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.4 }}
          >
            <Card className="p-4">
              <div className="text-[10px] uppercase tracking-widest text-white/40">{k.label}</div>
              <div
                className="mt-2 text-2xl font-semibold tracking-tight"
                style={k.accent ? { color: k.accent } : undefined}
              >
                {k.value}
              </div>
              <div className="mt-1 text-[10px] text-white/30">{k.hint}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Alerts — compliance & rule violations */}
      <SectionCard
        title="Attention required"
        description="Business-rule guardrails currently affecting operations"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {ALERTS.map((a) => {
            const Icon = a.icon
            const border = a.tone === 'red' ? 'border-[#ff5f57]/25' : 'border-[#f59e0b]/25'
            const bg = a.tone === 'red' ? 'bg-[#ff5f57]/[0.06]' : 'bg-[#f59e0b]/[0.06]'
            const ic = a.tone === 'red' ? 'text-[#ff8a84]' : 'text-[#fbbf24]'
            return (
              <div key={a.title} className={`flex gap-3 rounded-lg border ${border} ${bg} p-3.5`}>
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${ic}`} />
                <div>
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="mt-0.5 text-xs text-white/50">{a.detail}</div>
                </div>
              </div>
            )
          })}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent trips */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Recent Trips</div>
            <button className="inline-flex items-center gap-1 text-xs text-[#7db3ff] hover:text-white">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-white/35">
                  <th className="pb-3 font-medium">Trip</th>
                  <th className="pb-3 font-medium">Route</th>
                  <th className="pb-3 font-medium">Vehicle</th>
                  <th className="pb-3 font-medium">Driver</th>
                  <th className="pb-3 font-medium">Cargo</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {RECENT_TRIPS.map((t) => (
                  <tr key={t.trip} className="text-white/80">
                    <td className="py-3 font-medium">{t.trip}</td>
                    <td className="py-3 text-white/60">{t.route}</td>
                    <td className="py-3">{t.vehicle}</td>
                    <td className="py-3">{t.driver}</td>
                    <td className="py-3 text-white/50">{t.cargo}</td>
                    <td className="py-3">
                      <StatusBadge tone={t.tone} label={t.status} />
                    </td>
                    <td className="py-3 text-white/50">{t.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Fleet utilization highlight */}
        <SectionCard title="Fleet Utilization" description="active on-trip vehicles / total operational">
          <div className="flex items-end gap-2">
            <div className="text-4xl font-semibold tracking-tight text-[#4ade80]">81%</div>
            <div className="mb-1 text-xs text-[#4ade80]/70">+6% vs last week</div>
          </div>
          <Progress value={81} color="#28c840" height={10} />
          <div className="mt-4 space-y-1 text-xs text-white/45">
            <div className="flex justify-between"><span>Operational vehicles</span><span className="text-white/70">57</span></div>
            <div className="flex justify-between"><span>Currently on trip</span><span className="text-white/70">18</span></div>
            <div className="flex justify-between"><span>Idle & available</span><span className="text-white/70">42</span></div>
          </div>
        </SectionCard>
      </div>

      {/* Status breakdowns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Vehicle Status" description="Vehicle.status enum · AVAILABLE · ON_TRIP · IN_SHOP · RETIRED">
          <div className="space-y-4">
            {VEHICLE_STATUS.map((s) => (
              <Progress key={s.label} label={s.label} hint={String(s.value)} value={s.value} max={s.total} color={s.color} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Driver Status" description="Driver.status enum · AVAILABLE · ON_TRIP · OFF_DUTY · SUSPENDED">
          <div className="space-y-4">
            {DRIVER_STATUS.map((s) => (
              <Progress key={s.label} label={s.label} hint={String(s.value)} value={s.value} max={s.total} color={s.color} />
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
