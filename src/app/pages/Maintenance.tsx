import { useEffect, useState } from 'react'
import { Wrench } from 'lucide-react'
import {
  Card,
  PageHeader,
  StatusBadge,
  RuleNote,
  SectionCard,
  StateFlow,
  FormRow,
  fieldInputCls,
} from '../ui'
import { useAuth } from '../../lib/auth'
import {
  MaintenanceApi,
  VehiclesApi,
  apiError,
  type MaintenanceLog,
  type Vehicle,
} from '../../lib/api'

const SERVICE_TYPES = ['Oil Change', 'Engine Repair', 'Tyre Replace', 'Brake Service', 'Inspection']

function fmtDate(s?: string | null) {
  return s ? new Date(s).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : '—'
}

export function Maintenance() {
  const { user } = useAuth()
  const canWrite = user?.role === 'FLEET_MANAGER'

  const [tab, setTab] = useState<'open' | 'closed'>('open')
  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [openCount, setOpenCount] = useState(0)
  const [closedCount, setClosedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  const [vehicleId, setVehicleId] = useState('')
  const [type, setType] = useState(SERVICE_TYPES[0])
  const [cost, setCost] = useState(2600)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [closingId, setClosingId] = useState<string | null>(null)

  const loadLogs = () => {
    setLoading(true)
    setError(null)
    MaintenanceApi.list({ isOpen: tab === 'open', limit: 50 })
      .then((r) => setLogs(r.data))
      .catch((e) => setError(apiError(e)))
      .finally(() => setLoading(false))
  }
  const loadCounts = () => {
    MaintenanceApi.list({ isOpen: true, limit: 1 }).then((r) => setOpenCount(r.meta.total)).catch(() => {})
    MaintenanceApi.list({ isOpen: false, limit: 1 }).then((r) => setClosedCount(r.meta.total)).catch(() => {})
  }
  const loadVehicles = () => {
    VehiclesApi.list({ limit: 100 }).then((r) => setVehicles(r.data.filter((v) => v.status !== 'RETIRED'))).catch(() => {})
  }

  useEffect(loadLogs, [tab])
  useEffect(() => {
    loadCounts()
    loadVehicles()
  }, [])

  const mtdCost = logs.reduce((s, l) => s + l.cost, 0)

  const openRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setNotice(null)
    try {
      await MaintenanceApi.open({ vehicleId, type, cost: Number(cost), notes: notes || undefined })
      setNotice('Record opened — vehicle set to IN_SHOP.')
      setVehicleId('')
      setNotes('')
      setTab('open')
      loadLogs()
      loadCounts()
      loadVehicles()
    } catch (err) {
      setFormError(apiError(err))
    } finally {
      setSubmitting(false)
    }
  }
  const closeRecord = async (id: string) => {
    setClosingId(id)
    try {
      await MaintenanceApi.close(id)
      loadLogs()
      loadCounts()
      loadVehicles()
    } catch (err) {
      setError(apiError(err))
    } finally {
      setClosingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        subtitle="Opening a record flips the vehicle to IN_SHOP and pulls it from the dispatch pool — automatically."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <Wrench className="h-4 w-4 text-[#fbbf24]" />
          <div className="mt-3 text-2xl font-semibold">{openCount}</div>
          <div className="mt-0.5 text-xs text-white/45">Open (IN_SHOP)</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40">{tab === 'open' ? 'Open' : 'Closed'} service cost</div>
          <div className="mt-2 text-2xl font-semibold">₹{mtdCost.toLocaleString('en-IN')}</div>
          <div className="mt-0.5 text-xs text-white/45">feeds operational cost</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Closed records</div>
          <div className="mt-2 text-2xl font-semibold">{closedCount}</div>
          <div className="mt-0.5 text-xs text-white/45">completed services</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Pool impact</div>
          <div className="mt-2 text-2xl font-semibold text-[#fbbf24]">−{openCount}</div>
          <div className="mt-0.5 text-xs text-white/45">vehicles removed from dispatch</div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {canWrite ? (
          <Card className="p-5 lg:col-span-2">
            <div className="text-sm font-semibold">Log service record</div>
            <form className="mt-4 space-y-4" onSubmit={openRecord}>
              <FormRow label="Vehicle">
                <select required value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className={fieldInputCls}>
                  <option value="" className="bg-[#0c0c0c]">Select vehicle…</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id} className="bg-[#0c0c0c]">
                      {v.name} · {v.regNo} ({v.status})
                    </option>
                  ))}
                </select>
              </FormRow>
              <FormRow label="Service Type">
                <select value={type} onChange={(e) => setType(e.target.value)} className={fieldInputCls}>
                  {SERVICE_TYPES.map((t) => <option key={t} className="bg-[#0c0c0c]">{t}</option>)}
                </select>
              </FormRow>
              <FormRow label="Cost (₹)">
                <input type="number" min={0} value={cost} onChange={(e) => setCost(Number(e.target.value))} className={fieldInputCls} />
              </FormRow>
              <FormRow label="Notes (optional)">
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldInputCls} />
              </FormRow>
              {formError ? <div className="rounded-lg border border-[#ff5f57]/40 bg-[#ff5f57]/10 px-3 py-2 text-xs text-[#ff8a84]">{formError}</div> : null}
              {notice ? <div className="rounded-lg border border-[#28c840]/40 bg-[#28c840]/10 px-3 py-2 text-xs text-[#4ade80]">{notice}</div> : null}
              <button type="submit" disabled={submitting || !vehicleId} className="w-full rounded-lg bg-[#e0972a] py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#f0a838] disabled:opacity-60">
                {submitting ? 'Opening…' : 'Open record → set vehicle IN_SHOP'}
              </button>
              <RuleNote>MaintenanceService.open(): vehicle.status → IN_SHOP. Closing restores it to AVAILABLE (unless RETIRED).</RuleNote>
            </form>
          </Card>
        ) : null}

        <Card className={`p-0 overflow-hidden ${canWrite ? 'lg:col-span-3' : 'lg:col-span-5'}`}>
          <div className="flex items-center gap-1 border-b border-white/10 p-3">
            <Tab active={tab === 'open'} onClick={() => setTab('open')} label={`Open (${openCount})`} />
            <Tab active={tab === 'closed'} onClick={() => setTab('closed')} label={`Closed (${closedCount})`} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-widest text-white/35">
                  <th className="px-5 py-3 font-medium">Vehicle</th>
                  <th className="px-5 py-3 font-medium">Service</th>
                  <th className="px-5 py-3 font-medium">Cost</th>
                  <th className="px-5 py-3 font-medium">Opened</th>
                  <th className="px-5 py-3 font-medium">Closed</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-white/40 animate-pulse">Loading…</td></tr>
                ) : error ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-[#ff8a84]">{error}</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-white/40">No {tab} records.</td></tr>
                ) : (
                  logs.map((s) => (
                    <tr key={s.id} className="text-white/80 transition-colors hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 font-medium">{s.vehicle?.regNo ?? s.vehicleId.slice(0, 8)}</td>
                      <td className="px-5 py-3.5 text-white/60">{s.type}</td>
                      <td className="px-5 py-3.5 text-white/60">₹{s.cost.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3.5 text-white/60">{fmtDate(s.openedAt)}</td>
                      <td className="px-5 py-3.5 text-white/60">{fmtDate(s.closedAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <StatusBadge tone={s.isOpen ? 'inshop' : 'completed'} label={s.isOpen ? 'In Shop' : 'Closed'} />
                          {s.isOpen && canWrite ? (
                            <button onClick={() => closeRecord(s.id)} disabled={closingId === s.id} className="text-xs text-[#7db3ff] hover:text-white disabled:opacity-50">
                              {closingId === s.id ? 'Closing…' : 'Close →'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <SectionCard title="Maintenance side effects" description="Cross-entity transitions run inside a single transaction">
        <StateFlow
          states={[
            { label: 'Available', tone: 'available', note: 'in dispatch pool' },
            { label: 'In Shop', tone: 'inshop', note: 'open record' },
            { label: 'Available', tone: 'available', note: 'on close' },
          ]}
        />
      </SectionCard>
    </div>
  )
}

function Tab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${active ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5'}`}
    >
      {label}
    </button>
  )
}
