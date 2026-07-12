import { Fuel, Plus, Download } from 'lucide-react'
import {
  Card,
  PageHeader,
  ActionButton,
  SectionCard,
  Formula,
  Pill,
} from '../ui'

const FUEL_LOGS = [
  { vehicle: 'VAN-05', trip: 'TR001', date: '05 Jul 2026', liters: 42, cost: '3,150', kmpl: '8.9' },
  { vehicle: 'TRUCK-11', trip: 'TR002', date: '06 Jul 2026', liters: 110, cost: '8,400', kmpl: '4.1' },
  { vehicle: 'MINI-03', trip: '—', date: '06 Jul 2026', liters: 28, cost: '2,050', kmpl: '11.2' },
]

const EXPENSES: { trip: string; vehicle: string; category: string; amount: string; date: string }[] = [
  { trip: 'TR001', vehicle: 'VAN-05', category: 'Toll', amount: '120', date: '05 Jul' },
  { trip: 'TR002', vehicle: 'TRK-12', category: 'Toll', amount: '340', date: '06 Jul' },
  { trip: 'TR002', vehicle: 'TRK-12', category: 'Maintenance', amount: '18,000', date: '02 Jul' },
  { trip: '—', vehicle: 'VAN-09', category: 'License Renewal', amount: '1,200', date: '01 Jul' },
]

const CATEGORY_TONE: Record<string, 'brand' | 'amber' | 'red' | 'green' | 'default'> = {
  Toll: 'brand',
  Maintenance: 'amber',
  'License Renewal': 'green',
}

const ROLLUP = [
  { vehicle: 'TRUCK-11', fuel: 8400, maint: 18000 },
  { vehicle: 'MINI-03', fuel: 2050, maint: 6200 },
  { vehicle: 'VAN-05', fuel: 3150, maint: 2600 },
]

export function FuelExpenses() {
  const maxRollup = Math.max(...ROLLUP.map((r) => r.fuel + r.maint))
  const totalFuel = 13600
  const totalMaint = 26800

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fuel & Expense Management"
        subtitle="Fuel logs, categorized expenses, and the cost rollups that drive per-vehicle profitability."
        action={
          <div className="flex items-center gap-2">
            <ActionButton variant="ghost">
              <Download className="w-4 h-4" /> Export
            </ActionButton>
            <ActionButton variant="ghost">
              <Plus className="w-4 h-4" /> Add Expense
            </ActionButton>
            <ActionButton>
              <Fuel className="w-4 h-4" /> Log Fuel
            </ActionButton>
          </div>
        }
      />

      {/* Cost KPIs + formula */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Total fuel cost</div>
          <div className="mt-2 text-2xl font-semibold">₹{totalFuel.toLocaleString('en-IN')}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Total maintenance</div>
          <div className="mt-2 text-2xl font-semibold">₹{totalMaint.toLocaleString('en-IN')}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Operational cost (auto)</div>
          <div className="mt-2 text-2xl font-semibold text-[#e0972a]">₹{(totalFuel + totalMaint).toLocaleString('en-IN')}</div>
        </Card>
      </div>
      <Formula label="Operational cost per vehicle" expr="Σ fuel cost + Σ maintenance cost" />

      {/* Fuel logs */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 pb-0 text-sm font-semibold">Fuel Logs</div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-widest text-white/35">
                <th className="px-5 py-3 font-medium">Vehicle</th>
                <th className="px-5 py-3 font-medium">Trip</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Liters</th>
                <th className="px-5 py-3 font-medium">Cost</th>
                <th className="px-5 py-3 font-medium">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {FUEL_LOGS.map((f, i) => (
                <tr key={i} className="text-white/80 transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-medium">{f.vehicle}</td>
                  <td className="px-5 py-3.5 text-white/50">{f.trip}</td>
                  <td className="px-5 py-3.5 text-white/60">{f.date}</td>
                  <td className="px-5 py-3.5 text-white/60">{f.liters} L</td>
                  <td className="px-5 py-3.5 text-white/60">₹{f.cost}</td>
                  <td className="px-5 py-3.5 text-[#7db3ff]">{f.kmpl} km/l</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Expenses (categorized) */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 pb-0 text-sm font-semibold">Expenses</div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-widest text-white/35">
                <th className="px-5 py-3 font-medium">Trip</th>
                <th className="px-5 py-3 font-medium">Vehicle</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {EXPENSES.map((e, i) => (
                <tr key={i} className="text-white/80 transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-medium">{e.trip}</td>
                  <td className="px-5 py-3.5 text-white/60">{e.vehicle}</td>
                  <td className="px-5 py-3.5">
                    <Pill tone={CATEGORY_TONE[e.category] ?? 'default'}>{e.category}</Pill>
                  </td>
                  <td className="px-5 py-3.5 text-white/60">₹{e.amount}</td>
                  <td className="px-5 py-3.5 text-white/50">{e.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Per-vehicle rollup */}
      <SectionCard title="Operational cost by vehicle" description="Fuel + maintenance, stacked">
        <div className="space-y-5">
          {ROLLUP.map((r) => (
            <div key={r.vehicle}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-white/70">{r.vehicle}</span>
                <span className="text-white/40">
                  ₹{(r.fuel + r.maint).toLocaleString('en-IN')}
                  <span className="ml-2 text-white/25">fuel ₹{r.fuel.toLocaleString('en-IN')} · maint ₹{r.maint.toLocaleString('en-IN')}</span>
                </span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
                <div className="h-full bg-[#3D81E3]" style={{ width: `${(r.fuel / maxRollup) * 100}%` }} />
                <div className="h-full bg-[#f59e0b]" style={{ width: `${(r.maint / maxRollup) * 100}%` }} />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-4 pt-1 text-xs text-white/45">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#3D81E3]" /> Fuel</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Maintenance</span>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
