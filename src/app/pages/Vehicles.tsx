import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import {
  Card,
  PageHeader,
  StatusBadge,
  RuleNote,
  SectionCard,
  StateFlow,
  Pill,
} from '../ui'
import type { StatusTone } from '../ui'
import {
  VehiclesApi,
  AnalyticsApi,
  apiError,
  type Vehicle,
  type VehicleStatus,
} from '../../lib/api'

const STATUS_META: Record<VehicleStatus, { tone: StatusTone; label: string }> = {
  AVAILABLE: { tone: 'available', label: 'Available' },
  ON_TRIP: { tone: 'ontrip', label: 'On Trip' },
  IN_SHOP: { tone: 'inshop', label: 'In Shop' },
  RETIRED: { tone: 'retired', label: 'Retired' },
}

const FILTER_KEYS: (VehicleStatus | 'ALL')[] = [
  'ALL',
  'AVAILABLE',
  'ON_TRIP',
  'IN_SHOP',
  'RETIRED',
]

const LIMIT = 10

export function Vehicles() {
  const [active, setActive] = useState<VehicleStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const [rows, setRows] = useState<Vehicle[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // debounce search input -> query
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let active_ = true
    setLoading(true)
    setError(null)
    VehiclesApi.list({
      page,
      limit: LIMIT,
      ...(active !== 'ALL' ? { status: active } : {}),
      ...(query ? { q: query } : {}),
    })
      .then((res) => {
        if (!active_) return
        setRows(res.data)
        setTotal(res.meta.total)
        setTotalPages(res.meta.totalPages)
      })
      .catch((err) => active_ && setError(apiError(err)))
      .finally(() => active_ && setLoading(false))
    return () => {
      active_ = false
    }
  }, [active, query, page])

  // chip counts from KPI endpoint (best-effort)
  useEffect(() => {
    AnalyticsApi.kpis()
      .then((k) =>
        setCounts({ ALL: k.counts.vehicles.total, ...k.counts.vehicles.byStatus }),
      )
      .catch(() => setCounts({}))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Registry"
        subtitle="System of record for every fleet asset — registry, capacity, odometer, cost, and lifecycle status."
      />

      {/* Status filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => {
              setActive(key)
              setPage(1)
            }}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
              active === key
                ? 'border-white/25 bg-white/10 text-white'
                : 'border-white/10 bg-white/[0.02] text-white/55 hover:bg-white/5'
            }`}
          >
            {key === 'ALL' ? 'All' : STATUS_META[key].label}
            {counts[key] !== undefined ? (
              <span className="text-white/35">{counts[key]}</span>
            ) : null}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reg no, name, type…"
            className="rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-widest text-white/35">
                <th className="px-5 py-3 font-medium">Reg No.</th>
                <th className="px-5 py-3 font-medium">Name / Model</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Max Load</th>
                <th className="px-5 py-3 font-medium">Odometer</th>
                <th className="px-5 py-3 font-medium">Acq. Cost</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-white/40">
                    <span className="animate-pulse">Loading vehicles…</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-[#ff8a84]">
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-white/40">
                    No vehicles match this filter.
                  </td>
                </tr>
              ) : (
                rows.map((v) => (
                  <tr key={v.id} className="text-white/80 transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 font-mono text-xs">{v.regNo}</td>
                    <td className="px-5 py-3.5 font-medium">{v.name}</td>
                    <td className="px-5 py-3.5 text-white/60">{v.type}</td>
                    <td className="px-5 py-3.5 text-white/60">{v.maxLoadKg.toLocaleString()} kg</td>
                    <td className="px-5 py-3.5 text-white/60">{v.odometer.toLocaleString()} km</td>
                    <td className="px-5 py-3.5 text-white/60">₹{v.acquisitionCost.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge
                        tone={STATUS_META[v.status].tone}
                        label={STATUS_META[v.status].label}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-white/40">
          <span>
            {total === 0
              ? 'No results'
              : `Showing ${rows.length} of ${total} vehicle${total === 1 ? '' : 's'}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-white/10 px-2 py-1 hover:bg-white/5 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-white">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-md border border-white/10 px-2 py-1 hover:bg-white/5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </Card>

      {/* State machine + rules (static domain reference) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Vehicle lifecycle" description="Vehicle.status state machine">
          <StateFlow
            states={[
              { label: 'Available', tone: 'available', note: 'in dispatch pool' },
              { label: 'On Trip', tone: 'ontrip', note: 'dispatched' },
              { label: 'In Shop', tone: 'inshop', note: 'maintenance open' },
              { label: 'Retired', tone: 'retired', note: 'end of life' },
            ]}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill tone="brand">Dispatch → ON_TRIP</Pill>
            <Pill tone="green">Complete → AVAILABLE</Pill>
            <Pill tone="amber">Open maintenance → IN_SHOP</Pill>
          </div>
        </SectionCard>

        <SectionCard title="Enforced rules" description="Guarded in the service layer + DB constraints">
          <ul className="space-y-2.5 text-sm text-white/70">
            <li className="flex gap-2"><span className="text-[#4ade80]">✓</span> Registration number is unique <span className="text-white/35">(DB UNIQUE → 422)</span></li>
            <li className="flex gap-2"><span className="text-[#4ade80]">✓</span> Retired &amp; In Shop vehicles are excluded from the dispatch pool</li>
            <li className="flex gap-2"><span className="text-[#4ade80]">✓</span> A vehicle already ON_TRIP cannot be reassigned</li>
            <li className="flex gap-2"><span className="text-[#4ade80]">✓</span> Cargo weight must not exceed max load on dispatch</li>
          </ul>
          <RuleNote>
            Deleting a vehicle referenced by trips is restricted (ON DELETE RESTRICT); fuel, expense, and maintenance children cascade.
          </RuleNote>
        </SectionCard>
      </div>
    </div>
  )
}
