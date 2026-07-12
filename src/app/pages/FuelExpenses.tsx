import { useEffect, useState } from 'react'
import { Fuel, Plus } from 'lucide-react'
import {
  Card,
  PageHeader,
  ActionButton,
  SectionCard,
  Formula,
  Pill,
  Modal,
  FormRow,
  fieldInputCls,
} from '../ui'
import { useAuth } from '../../lib/auth'
import {
  FuelExpensesApi,
  VehiclesApi,
  AnalyticsApi,
  apiError,
  type FuelLog,
  type Expense,
  type CostRollup,
  type Vehicle,
  type VehicleReportRow,
} from '../../lib/api'

const CATEGORY_TONE: Record<string, 'brand' | 'amber' | 'red' | 'green' | 'default'> = {
  Toll: 'brand',
  Fuel: 'brand',
  Maintenance: 'amber',
  Tolls: 'brand',
  Insurance: 'green',
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
}

export function FuelExpenses() {
  const { user } = useAuth()
  const canWrite = !!user && ['FINANCIAL_ANALYST', 'FLEET_MANAGER'].includes(user.role)

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [rollup, setRollup] = useState<CostRollup | null>(null)
  const [report, setReport] = useState<VehicleReportRow[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [fuelOpen, setFuelOpen] = useState(false)
  const [expOpen, setExpOpen] = useState(false)
  const [fuelForm, setFuelForm] = useState({ vehicleId: '', liters: 40, cost: 3000 })
  const [expForm, setExpForm] = useState({ vehicleId: '', category: 'Toll', amount: 200 })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const loadAll = () => {
    setLoading(true)
    setError(null)
    Promise.all([
      FuelExpensesApi.listFuel({ limit: 20 }),
      FuelExpensesApi.listExpenses({ limit: 20 }),
      FuelExpensesApi.rollup(),
      AnalyticsApi.report(),
    ])
      .then(([f, e, r, rep]) => {
        setFuelLogs(f.data)
        setExpenses(e.data)
        setRollup(r)
        setReport(rep)
      })
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false))
  }
  useEffect(loadAll, [])
  useEffect(() => {
    VehiclesApi.list({ limit: 100 }).then((r) => setVehicles(r.data)).catch(() => {})
  }, [])

  const saveFuel = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      await FuelExpensesApi.createFuel({ vehicleId: fuelForm.vehicleId, liters: Number(fuelForm.liters), cost: Number(fuelForm.cost) })
      setFuelOpen(false)
      loadAll()
    } catch (err) {
      setFormError(apiError(err))
    } finally {
      setSaving(false)
    }
  }
  const saveExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      await FuelExpensesApi.createExpense({ vehicleId: expForm.vehicleId, category: expForm.category, amount: Number(expForm.amount) })
      setExpOpen(false)
      loadAll()
    } catch (err) {
      setFormError(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  const perVehicle = report
    .map((r) => ({ regNo: r.regNo, fuel: r.fuelCost, maint: r.maintenanceCost, total: r.fuelCost + r.maintenanceCost }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
  const maxRollup = Math.max(1, ...perVehicle.map((r) => r.total))

  const vehName = (id: string) => vehicles.find((v) => v.id === id)?.regNo ?? id.slice(0, 8)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fuel & Expense Management"
        subtitle="Fuel logs, categorized expenses, and the cost rollups that drive per-vehicle profitability."
        action={
          canWrite ? (
            <div className="flex items-center gap-2">
              <ActionButton variant="ghost" onClick={() => setExpOpen(true)}>
                <Plus className="w-4 h-4" /> Add Expense
              </ActionButton>
              <ActionButton onClick={() => setFuelOpen(true)}>
                <Fuel className="w-4 h-4" /> Log Fuel
              </ActionButton>
            </div>
          ) : undefined
        }
      />

      {error ? <div className="rounded-lg border border-[#ff5f57]/40 bg-[#ff5f57]/10 px-4 py-3 text-sm text-[#ff8a84]">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Total fuel cost</div>
          <div className="mt-2 text-2xl font-semibold">₹{(rollup?.fuelCost ?? 0).toLocaleString('en-IN')}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Total maintenance</div>
          <div className="mt-2 text-2xl font-semibold">₹{(rollup?.maintenanceCost ?? 0).toLocaleString('en-IN')}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Operational cost (auto)</div>
          <div className="mt-2 text-2xl font-semibold text-[#e0972a]">₹{(rollup?.operationalCost ?? 0).toLocaleString('en-IN')}</div>
        </Card>
      </div>
      <Formula label="Operational cost per vehicle" expr="Σ fuel cost + Σ maintenance cost" />

      <Card className="p-0 overflow-hidden">
        <div className="p-5 pb-0 text-sm font-semibold">Fuel Logs</div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-widest text-white/35">
                <th className="px-5 py-3 font-medium">Vehicle</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Liters</th>
                <th className="px-5 py-3 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-white/40 animate-pulse">Loading…</td></tr>
              ) : fuelLogs.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-white/40">No fuel logs yet.</td></tr>
              ) : (
                fuelLogs.map((f) => (
                  <tr key={f.id} className="text-white/80 transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 font-medium">{f.vehicle?.regNo ?? vehName(f.vehicleId)}</td>
                    <td className="px-5 py-3.5 text-white/60">{fmtDate(f.date)}</td>
                    <td className="px-5 py-3.5 text-white/60">{f.liters} L</td>
                    <td className="px-5 py-3.5 text-white/60">₹{f.cost.toLocaleString('en-IN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-5 pb-0 text-sm font-semibold">Expenses</div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-widest text-white/35">
                <th className="px-5 py-3 font-medium">Vehicle</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-white/40 animate-pulse">Loading…</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-white/40">No expenses yet.</td></tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="text-white/80 transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 font-medium">{e.vehicle?.regNo ?? vehName(e.vehicleId)}</td>
                    <td className="px-5 py-3.5"><Pill tone={CATEGORY_TONE[e.category] ?? 'default'}>{e.category}</Pill></td>
                    <td className="px-5 py-3.5 text-white/60">₹{e.amount.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5 text-white/50">{fmtDate(e.date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <SectionCard title="Operational cost by vehicle" description="Fuel + maintenance, stacked (live)">
        {perVehicle.length === 0 ? (
          <div className="py-6 text-center text-sm text-white/40">No cost data yet.</div>
        ) : (
          <div className="space-y-5">
            {perVehicle.map((r) => (
              <div key={r.regNo}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-white/70">{r.regNo}</span>
                  <span className="text-white/40">
                    ₹{r.total.toLocaleString('en-IN')}
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
        )}
      </SectionCard>

      <Modal open={fuelOpen} onClose={() => setFuelOpen(false)} title="Log fuel">
        <form className="space-y-3" onSubmit={saveFuel}>
          <FormRow label="Vehicle">
            <select required value={fuelForm.vehicleId} onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })} className={fieldInputCls}>
              <option value="" className="bg-[#0c0c0c]">Select vehicle…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id} className="bg-[#0c0c0c]">{v.name} · {v.regNo}</option>)}
            </select>
          </FormRow>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Liters"><input type="number" min={0} value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: Number(e.target.value) })} className={fieldInputCls} /></FormRow>
            <FormRow label="Cost (₹)"><input type="number" min={0} value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: Number(e.target.value) })} className={fieldInputCls} /></FormRow>
          </div>
          {formError ? <div className="rounded-lg border border-[#ff5f57]/40 bg-[#ff5f57]/10 px-3 py-2 text-xs text-[#ff8a84]">{formError}</div> : null}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setFuelOpen(false)} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving || !fuelForm.vehicleId} className="rounded-lg bg-[#e0972a] px-4 py-2 text-sm font-semibold text-black hover:bg-[#f0a838] disabled:opacity-60">{saving ? 'Saving…' : 'Log fuel'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={expOpen} onClose={() => setExpOpen(false)} title="Add expense">
        <form className="space-y-3" onSubmit={saveExpense}>
          <FormRow label="Vehicle">
            <select required value={expForm.vehicleId} onChange={(e) => setExpForm({ ...expForm, vehicleId: e.target.value })} className={fieldInputCls}>
              <option value="" className="bg-[#0c0c0c]">Select vehicle…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id} className="bg-[#0c0c0c]">{v.name} · {v.regNo}</option>)}
            </select>
          </FormRow>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Category">
              <select value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })} className={fieldInputCls}>
                {['Toll', 'Insurance', 'Parking', 'Fine', 'Other'].map((c) => <option key={c} className="bg-[#0c0c0c]">{c}</option>)}
              </select>
            </FormRow>
            <FormRow label="Amount (₹)"><input type="number" min={0} value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: Number(e.target.value) })} className={fieldInputCls} /></FormRow>
          </div>
          {formError ? <div className="rounded-lg border border-[#ff5f57]/40 bg-[#ff5f57]/10 px-3 py-2 text-xs text-[#ff8a84]">{formError}</div> : null}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setExpOpen(false)} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving || !expForm.vehicleId} className="rounded-lg bg-[#e0972a] px-4 py-2 text-sm font-semibold text-black hover:bg-[#f0a838] disabled:opacity-60">{saving ? 'Saving…' : 'Add expense'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
