import { useState } from 'react'
import { Plus, Search, Download } from 'lucide-react'
import {
  Card,
  PageHeader,
  StatusBadge,
  ActionButton,
  RuleNote,
  SectionCard,
  StateFlow,
  Pill,
} from '../ui'
import type { StatusTone } from '../ui'

type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED'

const STATUS_META: Record<VehicleStatus, { tone: StatusTone; label: string }> = {
  AVAILABLE: { tone: 'available', label: 'Available' },
  ON_TRIP: { tone: 'ontrip', label: 'On Trip' },
  IN_SHOP: { tone: 'inshop', label: 'In Shop' },
  RETIRED: { tone: 'retired', label: 'Retired' },
}

const VEHICLES: {
  reg: string
  name: string
  type: string
  maxLoad: string
  odometer: string
  acqCost: string
  opCost: string
  roi: string
  roiUp: boolean
  status: VehicleStatus
}[] = [
  { reg: 'GJ01BH521', name: 'VAN-05', type: 'Van', maxLoad: '500 kg', odometer: '74,000', acqCost: '6,20,000', opCost: '41,200', roi: '+18.4%', roiUp: true, status: 'AVAILABLE' },
  { reg: 'GJ01BH981', name: 'TRUCK-11', type: 'Truck', maxLoad: '5,000 kg', odometer: '1,82,000', acqCost: '24,50,000', opCost: '2,14,900', roi: '+9.1%', roiUp: true, status: 'ON_TRIP' },
  { reg: 'GJ01BH120', name: 'MINI-03', type: 'Mini', maxLoad: '1,000 kg', odometer: '66,000', acqCost: '4,10,000', opCost: '58,600', roi: '-3.2%', roiUp: false, status: 'IN_SHOP' },
  { reg: 'GJ01BH089', name: 'VAN-09', type: 'Van', maxLoad: '750 kg', odometer: '2,41,400', acqCost: '5,90,000', opCost: '1,02,300', roi: '+2.7%', roiUp: true, status: 'RETIRED' },
]

const FILTERS: { key: VehicleStatus | 'ALL'; label: string; count: number }[] = [
  { key: 'ALL', label: 'All', count: 60 },
  { key: 'AVAILABLE', label: 'Available', count: 42 },
  { key: 'ON_TRIP', label: 'On Trip', count: 18 },
  { key: 'IN_SHOP', label: 'In Shop', count: 5 },
  { key: 'RETIRED', label: 'Retired', count: 3 },
]

export function Vehicles() {
  const [active, setActive] = useState<VehicleStatus | 'ALL'>('ALL')
  const rows = active === 'ALL' ? VEHICLES : VEHICLES.filter((v) => v.status === active)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Registry"
        subtitle="System of record for every fleet asset — registry, capacity, odometer, cost, and lifecycle status."
        action={
          <div className="flex items-center gap-2">
            <ActionButton variant="ghost">
              <Download className="w-4 h-4" /> Export
            </ActionButton>
            <ActionButton>
              <Plus className="w-4 h-4" /> Add Vehicle
            </ActionButton>
          </div>
        }
      />

      {/* Status filter chips (enum + counts) */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActive(f.key)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
              active === f.key
                ? 'border-white/25 bg-white/10 text-white'
                : 'border-white/10 bg-white/[0.02] text-white/55 hover:bg-white/5'
            }`}
          >
            {f.label}
            <span className="text-white/35">{f.count}</span>
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            placeholder="Search reg no…"
            className="rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-widest text-white/35">
                <th className="px-5 py-3 font-medium">Reg No.</th>
                <th className="px-5 py-3 font-medium">Name / Model</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Max Load</th>
                <th className="px-5 py-3 font-medium">Odometer</th>
                <th className="px-5 py-3 font-medium">Acq. Cost</th>
                <th className="px-5 py-3 font-medium">Op. Cost</th>
                <th className="px-5 py-3 font-medium">ROI</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((v) => (
                <tr key={v.reg} className="text-white/80 transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-mono text-xs">{v.reg}</td>
                  <td className="px-5 py-3.5 font-medium">{v.name}</td>
                  <td className="px-5 py-3.5 text-white/60">{v.type}</td>
                  <td className="px-5 py-3.5 text-white/60">{v.maxLoad}</td>
                  <td className="px-5 py-3.5 text-white/60">{v.odometer} km</td>
                  <td className="px-5 py-3.5 text-white/60">₹{v.acqCost}</td>
                  <td className="px-5 py-3.5 text-white/60">₹{v.opCost}</td>
                  <td className={`px-5 py-3.5 font-medium ${v.roiUp ? 'text-[#4ade80]' : 'text-[#ff8a84]'}`}>{v.roi}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge tone={STATUS_META[v.status].tone} label={STATUS_META[v.status].label} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-white/40">
          <span>Showing {rows.length} of {VEHICLES.length} vehicles</span>
          <div className="flex items-center gap-1">
            <button className="rounded-md border border-white/10 px-2 py-1 hover:bg-white/5">Prev</button>
            <button className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-white">1</button>
            <button className="rounded-md border border-white/10 px-2 py-1 hover:bg-white/5">2</button>
            <button className="rounded-md border border-white/10 px-2 py-1 hover:bg-white/5">Next</button>
          </div>
        </div>
      </Card>

      {/* State machine + rules */}
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
            <li className="flex gap-2"><span className="text-[#4ade80]">✓</span> Registration number is unique <span className="text-white/35">(DB UNIQUE constraint)</span></li>
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
