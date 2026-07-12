import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, X, Zap } from 'lucide-react'
import { Card, PageHeader, StatusBadge, SectionCard, Pill } from '../ui'
import type { StatusTone } from '../ui'
import {
  VehiclesApi,
  DriversApi,
  TripsApi,
  apiError,
  type Vehicle,
  type Driver,
  type Trip,
  type TripStatus,
} from '../../lib/api'

const LIFECYCLE: { label: string; tone: StatusTone; effect: string }[] = [
  { label: 'Draft', tone: 'draft', effect: 'created, not yet assigned' },
  { label: 'Dispatched', tone: 'dispatched', effect: 'vehicle + driver → ON_TRIP' },
  { label: 'Completed', tone: 'completed', effect: 'records odometer + fuel, both → AVAILABLE' },
  { label: 'Cancelled', tone: 'cancelled', effect: 'restores both → AVAILABLE' },
]

const TRIP_TONE: Record<TripStatus, StatusTone> = {
  DRAFT: 'draft',
  DISPATCHED: 'dispatched',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

function driverEligible(d: Driver): boolean {
  return (
    d.status === 'AVAILABLE' &&
    new Date(d.licenseExpiry).getTime() > Date.now()
  )
}

export function Trips() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [boardLoading, setBoardLoading] = useState(true)
  const [boardError, setBoardError] = useState<string | null>(null)

  const [source, setSource] = useState('Gandhinagar Depot')
  const [destination, setDestination] = useState('Ahmedabad Hub')
  const [vehicleId, setVehicleId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [cargo, setCargo] = useState(400)
  const [distance, setDistance] = useState(34)

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadRefs = () => {
    VehiclesApi.list({ status: 'AVAILABLE', limit: 100 })
      .then((r) => setVehicles(r.data))
      .catch(() => setVehicles([]))
    DriversApi.list({ limit: 100 })
      .then((r) => setDrivers(r.data))
      .catch(() => setDrivers([]))
  }
  const loadBoard = () => {
    setBoardLoading(true)
    setBoardError(null)
    TripsApi.list({ limit: 8 })
      .then((r) => setTrips(r.data))
      .catch((e) => setBoardError(apiError(e)))
      .finally(() => setBoardLoading(false))
  }

  useEffect(() => {
    loadRefs()
    loadBoard()
  }, [])

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId)
  const selectedDriver = drivers.find((d) => d.id === driverId)
  const capacity = selectedVehicle?.maxLoadKg ?? 0

  const overCapacity = capacity > 0 && cargo > capacity
  const over = useMemo(() => cargo - capacity, [cargo, capacity])

  const guards = [
    {
      ok: !!selectedVehicle && !overCapacity,
      label: selectedVehicle
        ? `Cargo ${cargo} kg ≤ vehicle max load ${capacity.toLocaleString()} kg`
        : 'Select an available vehicle',
    },
    {
      ok: !!selectedDriver && new Date(selectedDriver.licenseExpiry).getTime() > Date.now(),
      label: 'Driver license valid (not expired)',
    },
    {
      ok: !!selectedDriver && selectedDriver.status === 'AVAILABLE',
      label: 'Driver not suspended and not already ON_TRIP',
    },
    {
      ok: !!selectedVehicle && selectedVehicle.status === 'AVAILABLE',
      label: 'Vehicle AVAILABLE (not IN_SHOP / RETIRED / ON_TRIP)',
    },
  ]
  const canDispatch = guards.every((g) => g.ok) && !submitting

  const buildBody = () => ({
    source,
    destination,
    vehicleId,
    driverId,
    cargoWeight: Number(cargo),
    plannedDistance: Number(distance),
  })

  const handleDispatch = async () => {
    setFormError(null)
    setNotice(null)
    setSubmitting(true)
    try {
      const trip = await TripsApi.create(buildBody())
      await TripsApi.dispatch(trip.id)
      setNotice('Trip dispatched — vehicle and driver set to ON_TRIP.')
      loadRefs()
      loadBoard()
    } catch (err) {
      setFormError(apiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDraft = async () => {
    setFormError(null)
    setNotice(null)
    setSubmitting(true)
    try {
      await TripsApi.create(buildBody())
      setNotice('Draft trip saved.')
      loadBoard()
    } catch (err) {
      setFormError(apiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const eligibleDrivers = drivers.filter(driverEligible)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trip Dispatcher"
        subtitle="The dispatch engine — every transition is an atomic transaction across trip, vehicle, and driver."
        action={<Pill tone="brand"><Zap className="w-3.5 h-3.5" /> Rule-guarded state machine</Pill>}
      />

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
                <input value={source} onChange={(e) => setSource(e.target.value)} className={inputCls} />
              </FormField>
              <FormField label="Destination">
                <input value={destination} onChange={(e) => setDestination(e.target.value)} className={inputCls} />
              </FormField>
            </div>
            <FormField label="Vehicle (AVAILABLE only)">
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className={inputCls}>
                <option value="" className="bg-[#0c0c0c]">Select vehicle…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id} className="bg-[#0c0c0c]">
                    {v.name} · {v.regNo} · max {v.maxLoadKg.toLocaleString()} kg
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Driver (eligible only)">
              <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className={inputCls}>
                <option value="" className="bg-[#0c0c0c]">Select driver…</option>
                {eligibleDrivers.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#0c0c0c]">
                    {d.name} · {d.licenseCategory} · safety {d.safetyScore}
                  </option>
                ))}
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Cargo Weight (kg)">
                <input type="number" value={cargo} onChange={(e) => setCargo(Number(e.target.value))} className={inputCls} />
              </FormField>
              <FormField label="Planned Distance (km)">
                <input type="number" value={distance} onChange={(e) => setDistance(Number(e.target.value))} className={inputCls} />
              </FormField>
            </div>

            {overCapacity ? (
              <div className="rounded-lg border border-[#ff5f57]/40 bg-[#ff5f57]/10 p-3 text-xs text-[#ff8a84]">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4" /> 422 · Cargo exceeds capacity
                </div>
                <div className="mt-1.5 space-y-0.5 text-[#ff8a84]/90">
                  <div>Vehicle max load: {capacity.toLocaleString()} kg · cargo: {cargo} kg</div>
                  <div>Over by {over.toLocaleString()} kg — dispatch blocked by TripService guard.</div>
                </div>
              </div>
            ) : null}

            {formError ? (
              <div className="rounded-lg border border-[#ff5f57]/40 bg-[#ff5f57]/10 px-3 py-2.5 text-xs text-[#ff8a84]">
                {formError}
              </div>
            ) : null}
            {notice ? (
              <div className="rounded-lg border border-[#28c840]/40 bg-[#28c840]/10 px-3 py-2.5 text-xs text-[#4ade80]">
                {notice}
              </div>
            ) : null}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleDispatch}
                disabled={!canDispatch}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  !canDispatch
                    ? 'cursor-not-allowed bg-white/10 text-white/30'
                    : 'bg-[#e0972a] text-black hover:bg-[#f0a838]'
                }`}
              >
                {submitting ? 'Working…' : canDispatch ? 'Dispatch trip' : 'Dispatch blocked'}
              </button>
              <button
                onClick={handleDraft}
                disabled={submitting || !vehicleId || !driverId}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5 disabled:opacity-40"
              >
                Save as draft
              </button>
            </div>
          </div>
        </Card>

        {/* Guards + live board */}
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

          <SectionCard title="Live board" description="Latest trips across every status">
            {boardLoading ? (
              <div className="py-8 text-center text-sm text-white/40 animate-pulse">Loading trips…</div>
            ) : boardError ? (
              <div className="py-8 text-center text-sm text-[#ff8a84]">{boardError}</div>
            ) : trips.length === 0 ? (
              <div className="py-8 text-center text-sm text-white/40">No trips yet — dispatch one to see it here.</div>
            ) : (
              <div className="space-y-3">
                {trips.map((t) => (
                  <div key={t.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-medium">
                        {t.source} → {t.destination}
                      </div>
                      <StatusBadge tone={TRIP_TONE[t.status]} label={t.status} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-white/40">
                      <span>
                        {t.vehicle?.regNo ?? '—'} · {t.driver?.name ?? 'Unassigned'}
                      </span>
                      <span>{t.cargoWeight.toLocaleString()} kg · {t.plannedDistance} km</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
