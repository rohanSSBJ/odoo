import { useMemo, useState } from 'react'
import { AlertTriangle, Check, X, Zap } from 'lucide-react'
import { Card, PageHeader, StatusBadge, SectionCard, Pill } from '../ui'
import type { StatusTone } from '../ui'

const LIFECYCLE: { label: string; tone: StatusTone; effect: string }[] = [
  { label: 'Draft', tone: 'draft', effect: 'created, not yet assigned' },
  { label: 'Dispatched', tone: 'dispatched', effect: 'vehicle + driver → ON_TRIP' },
  { label: 'Completed', tone: 'completed', effect: 'records odometer + fuel, both → AVAILABLE' },
  { label: 'Cancelled', tone: 'cancelled', effect: 'restores both → AVAILABLE' },
]

const LIVE_BOARD: {
  trip: string
  route: string
  tone: StatusTone
  status: string
  assignment: string
  meta: string
}[] = [
  { trip: 'TR001', route: 'Gandhinagar Depot → Ahmedabad Hub', tone: 'dispatched', status: 'Dispatched', assignment: 'VAN-05 · Alex', meta: 'ETA 45 min' },
  { trip: 'TR002', route: 'Vatva → Sanand Warehouse', tone: 'completed', status: 'Completed', assignment: 'TRK-12 · John', meta: '452 km · 168 L' },
  { trip: 'TR004', route: 'Vatva Industrial Area → Sanand', tone: 'draft', status: 'Draft', assignment: 'Unassigned', meta: 'Awaiting driver' },
  { trip: 'TR006', route: 'Maroa → Kalol Depot', tone: 'cancelled', status: 'Cancelled', assignment: 'Unassigned', meta: 'Vehicle sent to shop' },
]

const VEHICLE_CAPACITY = 500

export function Trips() {
  const [cargo, setCargo] = useState(700)
  const [licenseOk] = useState(true)
  const [vehicleFree] = useState(true)
  const [driverFree] = useState(true)

  const overCapacity = cargo > VEHICLE_CAPACITY
  const over = useMemo(() => cargo - VEHICLE_CAPACITY, [cargo])

  const guards = [
    { ok: !overCapacity, label: `Cargo ${cargo} kg ≤ vehicle max load ${VEHICLE_CAPACITY} kg` },
    { ok: licenseOk, label: 'Driver license valid (not expired)' },
    { ok: driverFree, label: 'Driver not suspended and not already ON_TRIP' },
    { ok: vehicleFree, label: 'Vehicle AVAILABLE (not IN_SHOP / RETIRED / ON_TRIP)' },
  ]
  const canDispatch = guards.every((g) => g.ok)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trip Dispatcher"
        subtitle="The dispatch engine — every transition is an atomic transaction across trip, vehicle, and driver."
        action={<Pill tone="brand"><Zap className="w-3.5 h-3.5" /> Rule-guarded state machine</Pill>}
      />

      {/* Annotated lifecycle */}
      <SectionCard title="Trip lifecycle" description="Trip.status · DRAFT → DISPATCHED → COMPLETED / CANCELLED">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LIFECYCLE.map((s, i) => (
            <div key={s.label} className="rounded-lg border border-white/10 bg-white/[0.02] p-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white/60">
                  {i + 1}
                </span>
                <StatusBadge tone={s.tone} label={s.label} />
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-white/45">{s.effect}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create trip form */}
        <Card className="p-5">
          <div className="text-sm font-semibold">Create &amp; dispatch trip</div>
          <p className="mt-1 text-xs text-white/40">Only AVAILABLE vehicles and eligible drivers appear in the pickers.</p>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Source">
                <input defaultValue="Gandhinagar Depot" className={inputCls} />
              </FormField>
              <FormField label="Destination">
                <input defaultValue="Ahmedabad Hub" className={inputCls} />
              </FormField>
            </div>
            <FormField label="Vehicle (AVAILABLE only)">
              <select className={inputCls}>
                <option className="bg-[#0c0c0c]">VAN-05 · max 500 kg</option>
                <option className="bg-[#0c0c0c]">TRUCK-11 · max 5,000 kg</option>
              </select>
            </FormField>
            <FormField label="Driver (eligible only)">
              <select className={inputCls}>
                <option className="bg-[#0c0c0c]">Alex Mathew · LMV · safety 96</option>
                <option className="bg-[#0c0c0c]">Priya Nair · LMV · safety 99</option>
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Cargo Weight (kg)">
                <input
                  type="number"
                  value={cargo}
                  onChange={(e) => setCargo(Number(e.target.value))}
                  className={inputCls}
                />
              </FormField>
              <FormField label="Planned Distance (km)">
                <input defaultValue={34} type="number" className={inputCls} />
              </FormField>
            </div>

            {overCapacity ? (
              <div className="rounded-lg border border-[#ff5f57]/40 bg-[#ff5f57]/10 p-3 text-xs text-[#ff8a84]">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4" /> 422 · Cargo exceeds capacity
                </div>
                <div className="mt-1.5 space-y-0.5 text-[#ff8a84]/90">
                  <div>Vehicle max load: {VEHICLE_CAPACITY} kg · cargo: {cargo} kg</div>
                  <div>Over by {over} kg — dispatch blocked by TripService guard.</div>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-3 pt-1">
              <button
                disabled={!canDispatch}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  !canDispatch
                    ? 'cursor-not-allowed bg-white/10 text-white/30'
                    : 'bg-[#e0972a] text-black hover:bg-[#f0a838]'
                }`}
              >
                {canDispatch ? 'Dispatch trip' : 'Dispatch blocked'}
              </button>
              <button className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5">
                Save as draft
              </button>
            </div>
          </div>
        </Card>

        {/* Dispatch guard checklist + live board */}
        <div className="space-y-6">
          <SectionCard title="Dispatch guard checklist" description="All must pass inside one transaction">
            <ul className="space-y-2.5">
              {guards.map((g) => (
                <li key={g.label} className="flex items-start gap-2.5 text-sm">
                  {g.ok ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#4ade80]" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8a84]" />
                  )}
                  <span className={g.ok ? 'text-white/70' : 'text-[#ff8a84]'}>{g.label}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Live board" description="All trips across every status">
            <div className="space-y-3">
              {LIVE_BOARD.map((t) => (
                <div key={t.trip} className="rounded-lg border border-white/10 bg-white/[0.02] p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-medium">{t.route}</div>
                    <StatusBadge tone={t.tone} label={t.status} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-white/40">
                    <span>{t.trip} · {t.assignment}</span>
                    <span>{t.meta}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none'

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-white/40">
        {label}
      </span>
      {children}
    </label>
  )
}
