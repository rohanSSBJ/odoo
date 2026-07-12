import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Download } from 'lucide-react'
import { Card, PageHeader, SectionCard, ActionButton } from '../ui'
import {
  AnalyticsApi,
  apiError,
  type Kpis,
  type VehicleReportRow,
} from '../../lib/api'

export function Analytics() {
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [report, setReport] = useState<VehicleReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([AnalyticsApi.kpis(), AnalyticsApi.report()])
      .then(([k, r]) => {
        setKpis(k)
        setReport(r)
      })
      .catch((e) => setError(apiError(e)))
      .finally(() => setLoading(false))
  }, [])

  const exportCsv = async () => {
    setDownloading(true)
    try {
      const blob = await AnalyticsApi.downloadCsv()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'transitops-vehicle-report.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(apiError(e))
    } finally {
      setDownloading(false)
    }
  }

  const kpiCards = [
    { label: 'Fleet Utilization', value: `${kpis?.fleetUtilizationPct ?? 0}%`, accent: '#4ade80', formula: 'on-trip vehicles / operational vehicles' },
    { label: 'Fuel Efficiency', value: `${kpis?.fuelEfficiency ?? 0} km/l`, accent: '#7db3ff', formula: 'distance / fuel consumed' },
    { label: 'Operational Cost', value: `₹${(kpis?.operationalCost ?? 0).toLocaleString('en-IN')}`, accent: '#fbbf24', formula: 'Σ fuel + Σ maintenance' },
    { label: 'Fleet ROI', value: `${((kpis?.fleetRoi ?? 0) * 100).toFixed(1)}%`, accent: '#A4F4FD', formula: '(revenue − (maint + fuel)) / acq. cost' },
  ]

  const withCost = report
    .map((r) => ({ ...r, opCost: r.fuelCost + r.maintenanceCost }))
    .sort((a, b) => b.opCost - a.opCost)
  const maxRevCost = Math.max(1, ...report.map((r) => Math.max(r.revenue, r.fuelCost + r.maintenanceCost)))
  const maxCost = Math.max(1, ...withCost.map((r) => r.opCost))
  const costliest = withCost.filter((r) => r.opCost > 0).slice(0, 6)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="The Financial Analyst's view — KPIs computed from live operational data, exportable for reporting."
        action={
          <ActionButton onClick={exportCsv}>
            <Download className="w-4 h-4" /> {downloading ? 'Exporting…' : 'Export CSV'}
          </ActionButton>
        }
      />

      {error ? <div className="rounded-lg border border-[#ff5f57]/40 bg-[#ff5f57]/10 px-4 py-3 text-sm text-[#ff8a84]">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">{k.label}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: k.accent }}>
              {loading ? <span className="text-white/20">…</span> : k.value}
            </div>
            <code className="mt-3 block font-mono text-[10px] leading-relaxed text-white/35">{k.formula}</code>
          </Card>
        ))}
      </div>

      <SectionCard title="Revenue vs. operational cost by vehicle" description="From completed trips + cost rollups (live)">
        {loading ? (
          <div className="py-10 text-center text-sm text-white/40 animate-pulse">Loading…</div>
        ) : report.length === 0 ? (
          <div className="py-10 text-center text-sm text-white/40">No vehicle data.</div>
        ) : (
          <>
            <div className="flex h-52 items-end justify-between gap-2">
              {report.map((r, i) => (
                <div key={r.regNo} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full items-end justify-center gap-1" style={{ height: '100%' }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(r.revenue / maxRevCost) * 100}%` }}
                      transition={{ delay: i * 0.05, duration: 0.6, ease: 'easeOut' }}
                      className="w-1/2 rounded-t-md bg-[#3D81E3]/80"
                      style={{ minHeight: 2 }}
                      title={`Revenue ₹${r.revenue.toLocaleString('en-IN')}`}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${((r.fuelCost + r.maintenanceCost) / maxRevCost) * 100}%` }}
                      transition={{ delay: i * 0.05 + 0.1, duration: 0.6, ease: 'easeOut' }}
                      className="w-1/2 rounded-t-md bg-[#f59e0b]/70"
                      style={{ minHeight: 2 }}
                      title={`Op cost ₹${(r.fuelCost + r.maintenanceCost).toLocaleString('en-IN')}`}
                    />
                  </div>
                  <span className="text-[10px] text-white/35">{r.regNo}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-white/45">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#3D81E3]" /> Revenue</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Operational cost</span>
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard title="Top costliest vehicles" description="Operational cost = fuel + maintenance">
        {loading ? (
          <div className="py-6 text-center text-sm text-white/40 animate-pulse">Loading…</div>
        ) : costliest.length === 0 ? (
          <div className="py-6 text-center text-sm text-white/40">No cost data yet.</div>
        ) : (
          <div className="space-y-4">
            {costliest.map((c) => (
              <div key={c.regNo}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-white/60">{c.regNo} · {c.name}</span>
                  <span className="text-white/40">₹{c.opCost.toLocaleString('en-IN')} · ROI {(c.roi * 100).toFixed(1)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(c.opCost / maxCost) * 100}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: c.roi < 0 ? '#ff5f57' : '#f59e0b' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
