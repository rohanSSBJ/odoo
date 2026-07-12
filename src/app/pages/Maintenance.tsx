import { useState } from 'react'
import { Wrench, Plus } from 'lucide-react'
import {
  Card,
  PageHeader,
  StatusBadge,
  RuleNote,
  SectionCard,
  StateFlow,
  ActionButton,
} from '../ui'
import type { StatusTone } from '../ui'

const LOGS: {
  vehicle: string
  type: string
  cost: string
  openedAt: string
  closedAt: string
  isOpen: boolean
  tone: StatusTone
  status: string
}[] = [
  { vehicle: 'VAN-05', type: 'Oil Change', cost: '2,600', openedAt: '06 Jul', closedAt: '—', isOpen: true, tone: 'inshop', status: 'In Shop' },
  { vehicle: 'MINI-03', type: 'Tyre Replace', cost: '6,200', openedAt: '05 Jul', closedAt: '—', isOpen: true, tone: 'inshop', status: 'In Shop' },
  { vehicle: 'TRUCK-11', type: 'Engine Repair', cost: '18,000', openedAt: '28 Jun', closedAt: '02 Jul', isOpen: false, tone: 'completed', status: 'Closed' },
  { vehicle: 'VAN-09', type: 'Brake Service', cost: '4,100', openedAt: '20 Jun', closedAt: '21 Jun', isOpen: false, tone: 'completed', status: 'Closed' },
]

const inputCls =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none'

export function Maintenance() {
  const [tab, setTab] = useState<'open' | 'closed'>('open')
  const rows = LOGS.filter((l) => (tab === 'open' ? l.isOpen : !l.isOpen))
  const openCount = LOGS.filter((l) => l.isOpen).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        subtitle="Opening a record flips the vehicle to IN_SHOP and pulls it from the dispatch pool — automatically."
        action={
          <ActionButton>
            <Plus className="w-4 h-4" /> Open service record
          </ActionButton>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <Wrench className="h-4 w-4 text-[#fbbf24]" />
          <div className="mt-3 text-2xl font-semibold">{openCount}</div>
          <div className="mt-0.5 text-xs text-white/45">Open (IN_SHOP)</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40">MTD service cost</div>
          <div className="mt-2 text-2xl font-semibold">₹30,900</div>
          <div className="mt-0.5 text-xs text-white/45">feeds operational cost</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Avg. turnaround</div>
          <div className="mt-2 text-2xl font-semibold">2.4d</div>
          <div className="mt-0.5 text-xs text-white/45">opened → closed</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Pool impact</div>
          <div className="mt-2 text-2xl font-semibold text-[#fbbf24]">−{openCount}</div>
          <div className="mt-0.5 text-xs text-white/45">vehicles removed from dispatch</div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Log service record */}
        <Card className="p-5 lg:col-span-2">
          <div className="text-sm font-semibold">Log service record</div>
          <div className="mt-4 space-y-4">
            <Field label="Vehicle">
              <select className={inputCls}>
                <option className="bg-[#0c0c0c]">VAN-05 (Available)</option>
                <option className="bg-[#0c0c0c]">TRUCK-11 (On Trip — closes on completion)</option>
              </select>
            </Field>
            <Field label="Service Type">
              <select className={inputCls}>
                <option className="bg-[#0c0c0c]">Oil Change</option>
                <option className="bg-[#0c0c0c]">Engine Repair</option>
                <option className="bg-[#0c0c0c]">Tyre Replace</option>
                <option className="bg-[#0c0c0c]">Brake Service</option>
                <option className="bg-[#0c0c0c]">Inspection</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cost (₹)">
                <input defaultValue={2600} type="number" className={inputCls} />
              </Field>
              <Field label="Opened at">
                <input defaultValue="2026-07-06" type="date" className={inputCls} />
              </Field>
            </div>
            <button className="w-full rounded-lg bg-[#e0972a] py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#f0a838]">
              Open record → set vehicle IN_SHOP
            </button>
            <RuleNote>
              Side effect runs in MaintenanceService.open(): vehicle.status → IN_SHOP. Closing restores it to AVAILABLE (unless RETIRED).
            </RuleNote>
          </div>
        </Card>

        {/* Service log with tabs */}
        <Card className="p-0 overflow-hidden lg:col-span-3">
          <div className="flex items-center gap-1 border-b border-white/10 p-3">
            <Tab active={tab === 'open'} onClick={() => setTab('open')} label={`Open (${LOGS.filter((l) => l.isOpen).length})`} />
            <Tab active={tab === 'closed'} onClick={() => setTab('closed')} label={`Closed (${LOGS.filter((l) => !l.isOpen).length})`} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
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
                {rows.map((s, i) => (
                  <tr key={i} className="text-white/80 transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 font-medium">{s.vehicle}</td>
                    <td className="px-5 py-3.5 text-white/60">{s.type}</td>
                    <td className="px-5 py-3.5 text-white/60">₹{s.cost}</td>
                    <td className="px-5 py-3.5 text-white/60">{s.openedAt}</td>
                    <td className="px-5 py-3.5 text-white/60">{s.closedAt}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <StatusBadge tone={s.tone} label={s.status} />
                        {s.isOpen ? (
                          <button className="text-xs text-[#7db3ff] hover:text-white">Close →</button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
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
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5'
      }`}
    >
      {label}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-white/40">
        {label}
      </span>
      {children}
    </label>
  )
}
