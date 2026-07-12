import { motion } from 'motion/react'
import { Download, FileText } from 'lucide-react'
import { Card, PageHeader, SectionCard, ActionButton } from '../ui'

const KPIS = [
  { label: 'Fleet Utilization', value: '81%', accent: '#4ade80', formula: 'on-trip vehicles / operational vehicles' },
  { label: 'Fuel Efficiency', value: '8.4 km/l', accent: '#7db3ff', formula: 'distance / fuel consumed' },
  { label: 'Operational Cost', value: '₹40,400', accent: '#fbbf24', formula: 'Σ fuel + Σ maintenance' },
  { label: 'Vehicle ROI', value: '14.2%', accent: '#A4F4FD', formula: '(revenue − (maint + fuel)) / acq. cost' },
]

const REVENUE = [48, 62, 55, 70, 52, 58, 66, 78]
const COST = [30, 41, 36, 44, 33, 38, 42, 47]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']

const COSTLIEST = [
  { name: 'TRUCK-11', value: 26400, pct: 100, color: '#ff5f57' },
  { name: 'MINI-03', value: 8250, pct: 62, color: '#f59e0b' },
  { name: 'VAN-05', value: 5750, pct: 40, color: '#3D81E3' },
]

const UTIL_TREND = [72, 74, 71, 78, 80, 79, 81]

export function Analytics() {
  const max = Math.max(...REVENUE)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="The Financial Analyst's view — KPIs computed from live operational data, exportable for reporting."
        action={
          <div className="flex items-center gap-2">
            <ActionButton variant="ghost">
              <FileText className="w-4 h-4" /> PDF
            </ActionButton>
            <ActionButton>
              <Download className="w-4 h-4" /> Export CSV
            </ActionButton>
          </div>
        }
      />

      {/* KPI cards with formulas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">{k.label}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: k.accent }}>
              {k.value}
            </div>
            <code className="mt-3 block font-mono text-[10px] leading-relaxed text-white/35">
              {k.formula}
            </code>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue vs cost */}
        <SectionCard title="Revenue vs. operational cost" description="Monthly, ₹ '000s" className="lg:col-span-2">
          <div className="flex h-52 items-end justify-between gap-2">
            {REVENUE.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full items-end justify-center gap-1" style={{ height: '100%' }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(v / max) * 100}%` }}
                    transition={{ delay: i * 0.05, duration: 0.6, ease: 'easeOut' }}
                    className="w-1/2 rounded-t-md bg-[#3D81E3]/80"
                    style={{ minHeight: 4 }}
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(COST[i] / max) * 100}%` }}
                    transition={{ delay: i * 0.05 + 0.1, duration: 0.6, ease: 'easeOut' }}
                    className="w-1/2 rounded-t-md bg-[#f59e0b]/70"
                    style={{ minHeight: 4 }}
                  />
                </div>
                <span className="text-[10px] text-white/35">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-white/45">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#3D81E3]" /> Revenue</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Operational cost</span>
          </div>
        </SectionCard>

        {/* Utilization trend sparkline */}
        <SectionCard title="Utilization trend" description="Last 7 weeks">
          <div className="flex h-52 items-end justify-between gap-1.5">
            {UTIL_TREND.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${v}%` }}
                  transition={{ delay: i * 0.05, duration: 0.6, ease: 'easeOut' }}
                  className="w-full rounded-t-md bg-[#28c840]/70"
                />
                <span className="text-[10px] text-white/35">W{i + 1}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center text-sm text-white/60">
            Current <span className="font-semibold text-[#4ade80]">81%</span>
          </div>
        </SectionCard>
      </div>

      {/* Costliest vehicles */}
      <SectionCard title="Top costliest vehicles" description="Operational cost = fuel + maintenance, month to date">
        <div className="space-y-4">
          {COSTLIEST.map((c) => (
            <div key={c.name}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-white/60">{c.name}</span>
                <span className="text-white/40">₹{c.value.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${c.pct}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: c.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
