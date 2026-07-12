import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { AlertTriangle, ShieldAlert, Wrench, TrendingUp, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, PageHeader, StatusBadge, SectionCard, Progress, Pill } from '../ui'
import type { StatusTone } from '../ui'
import {
  AnalyticsApi,
  TripsApi,
  apiError,
  type Kpis,
  type Trip,
  type TripStatus,
} from '../../lib/api'

const TRIP_TONE: Record<TripStatus, StatusTone> = {
  DRAFT: 'draft',
  DISPATCHED: 'dispatched',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

const VEHICLE_STATUS_META = [
  { key: 'AVAILABLE', label: 'Available', color: '#28c840' },
  { key: 'ON_TRIP', label: 'On Trip', color: '#3D81E3' },
  { key: 'IN_SHOP', label: 'In Shop', color: '#f59e0b' },
  { key: 'RETIRED', label: 'Retired', color: '#ff5f57' },
]
const DRIVER_STATUS_META = [
  { key: 'AVAILABLE', label: 'Available', color: '#28c840' },
  { key: 'ON_TRIP', label: 'On Trip', color: '#3D81E3' },
  { key: 'OFF_DUTY', label: 'Off Duty', color: '#f59e0b' },
  { key: 'SUSPENDED', label: 'Suspended', color: '#ff5f57' },
]

export function Dashboard() {
  const navigate = useNavigate()
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([AnalyticsApi.kpis(), TripsApi.list({ limit: 6 })])
      .then(([k, t]) => {
        if (!active) return
        setKpis(k)
        setTrips(t.data)
      })
      .catch((e) => active && setError(apiError(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const v = kpis?.counts.vehicles.byStatus ?? {}
  const d = kpis?.counts.drivers.byStatus ?? {}
  const trip = kpis?.counts.trips.byStatus ?? {}
  const totalVehicles = kpis?.counts.vehicles.total ?? 0
  const totalDrivers = Object.values(d).reduce((a, b) => a + b, 0)
  const operational = totalVehicles - (v.RETIRED ?? 0)

  const kpiCards = [
    { label: 'Total Vehicles', value: totalVehicles, hint: 'fleet size' },
    { label: 'Available', value: v.AVAILABLE ?? 0, hint: 'in dispatch pool' },
    { label: 'In Maintenance', value: v.IN_SHOP ?? 0, hint: 'IN_SHOP', accent: '#fbbf24' },
    { label: 'Active Trips', value: trip.DISPATCHED ?? 0, hint: 'DISPATCHED' },
    { label: 'Pending Trips', value: trip.DRAFT ?? 0, hint: 'DRAFT' },
    { label: 'Drivers on Trip', value: d.ON_TRIP ?? 0, hint: 'ON_TRIP' },
    {
      label: 'Fleet Utilization',
      value: `${kpis?.fleetUtilizationPct ?? 0}%`,
      hint: 'on-trip / operational',
      accent: '#4ade80',
    },
  ]

  const alerts = [
    {
      icon: ShieldAlert,
      tone: 'red' as const,
      show: (kpis?.alerts.expiredLicenses ?? 0) > 0,
      title: `${kpis?.alerts.expiredLicenses ?? 0} driver license(s) expired`,
      detail: 'Blocked from all trip assignment by the dispatch guard.',
    },
    {
      icon: AlertTriangle,
      tone: 'amber' as const,
      show: (kpis?.alerts.expiringLicenses ?? 0) > 0,
      title: `${kpis?.alerts.expiringLicenses ?? 0} license(s) expiring in 30 days`,
      detail: 'Safety Officer should queue renewals.',
    },
    {
      icon: Wrench,
      tone: 'amber' as const,
      show: (kpis?.alerts.openMaintenance ?? 0) > 0,
      title: `${kpis?.alerts.openMaintenance ?? 0} vehicle(s) In Shop`,
      detail: 'Removed from the dispatch pool until maintenance closes.',
    },
  ].filter((a) => a.show)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Operations Dashboard"
        subtitle="Live fleet, driver, and trip state — every transition enforced by the service layer."
        action={<Pill tone="brand"><TrendingUp className="w-3.5 h-3.5" /> Real-time system of record</Pill>}
      />

      {error ? (
        <div className="rounded-lg border border-[#ff5f57]/40 bg-[#ff5f57]/10 px-4 py-3 text-sm text-[#ff8a84]">
          {error}
        </div>
      ) : null}

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {kpiCards.map((k, i) => (
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
                {loading ? <span className="text-white/20">…</span> : k.value}
              </div>
              <div className="mt-1 text-[10px] text-white/30">{k.hint}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      <SectionCard
        title="Attention required"
        description="Business-rule guardrails currently affecting operations"
      >
        {loading ? (
          <div className="py-6 text-center text-sm text-white/40 animate-pulse">Loading alerts…</div>
        ) : alerts.length === 0 ? (
          <div className="py-6 text-center text-sm text-white/40">No active alerts — all clear.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {alerts.map((a) => {
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
        )}
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent trips */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Recent Trips</div>
            <button
              onClick={() => navigate('/trips')}
              className="inline-flex items-center gap-1 text-xs text-[#7db3ff] hover:text-white"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-white/35">
                  <th className="pb-3 font-medium">Route</th>
                  <th className="pb-3 font-medium">Vehicle</th>
                  <th className="pb-3 font-medium">Driver</th>
                  <th className="pb-3 font-medium">Cargo</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-white/40 animate-pulse">Loading…</td>
                  </tr>
                ) : trips.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-white/40">No trips yet.</td>
                  </tr>
                ) : (
                  trips.map((t) => (
                    <tr key={t.id} className="text-white/80">
                      <td className="py-3 text-white/60">{t.source} → {t.destination}</td>
                      <td className="py-3">{t.vehicle?.regNo ?? '—'}</td>
                      <td className="py-3">{t.driver?.name ?? '—'}</td>
                      <td className="py-3 text-white/50">{t.cargoWeight.toLocaleString()} kg</td>
                      <td className="py-3">
                        <StatusBadge tone={TRIP_TONE[t.status]} label={t.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Fleet utilization highlight */}
        <SectionCard title="Fleet Utilization" description="active on-trip vehicles / total operational">
          <div className="flex items-end gap-2">
            <div className="text-4xl font-semibold tracking-tight text-[#4ade80]">
              {kpis?.fleetUtilizationPct ?? 0}%
            </div>
          </div>
          <Progress value={kpis?.fleetUtilizationPct ?? 0} color="#28c840" height={10} />
          <div className="mt-4 space-y-1 text-xs text-white/45">
            <div className="flex justify-between"><span>Operational vehicles</span><span className="text-white/70">{operational}</span></div>
            <div className="flex justify-between"><span>Currently on trip</span><span className="text-white/70">{v.ON_TRIP ?? 0}</span></div>
            <div className="flex justify-between"><span>Idle &amp; available</span><span className="text-white/70">{v.AVAILABLE ?? 0}</span></div>
          </div>
        </SectionCard>
      </div>

      {/* Status breakdowns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Vehicle Status" description="Vehicle.status enum · AVAILABLE · ON_TRIP · IN_SHOP · RETIRED">
          <div className="space-y-4">
            {VEHICLE_STATUS_META.map((s) => (
              <Progress
                key={s.key}
                label={s.label}
                hint={String(v[s.key] ?? 0)}
                value={v[s.key] ?? 0}
                max={totalVehicles || 1}
                color={s.color}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Driver Status" description="Driver.status enum · AVAILABLE · ON_TRIP · OFF_DUTY · SUSPENDED">
          <div className="space-y-4">
            {DRIVER_STATUS_META.map((s) => (
              <Progress
                key={s.key}
                label={s.label}
                hint={String(d[s.key] ?? 0)}
                value={d[s.key] ?? 0}
                max={totalDrivers || 1}
                color={s.color}
              />
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
