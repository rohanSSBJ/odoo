import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, X, Zap } from 'lucide-react'
import { Card, PageHeader, StatusBadge, SectionCard, Pill, Modal, FormRow, fieldInputCls, KeyValue } from '../ui'
import type { StatusTone } from '../ui'
import { useAuth } from '../../lib/auth'
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
  const { user } = useAuth()
  const canWrite = !!user && ['DRIVER', 'FLEET_MANAGER'].includes(user.role)

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

  // board actions
  const [busyId, setBusyId] = useState<string | null>(null)
  const [boardMsg, setBoardMsg] = useState<string | null>(null)
  const [completeTrip, setCompleteTrip] = useState<Trip | null>(null)
  const [completeForm, setCompleteForm] = useState({ finalOdometer: 0, fuelConsumed: 0, revenue: 0 })
  const [summaryTrip, setSummaryTrip] = useState<Trip | null>(null)

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

  // ---- board actions ----
  const doAction = async (fn: () => Promise<unknown>, id: string, msg: string) => {
    setBusyId(id)
    setBoardMsg(null)
    try {
      await fn()
      setBoardMsg(msg)
      loadRefs()
      loadBoard()
    } catch (err) {
      setBoardMsg(apiError(err))
    } finally {
      setBusyId(null)
    }
  }
  const dispatchExisting = (t: Trip) =>
    doAction(() => TripsApi.dispatch(t.id), t.id, 'Trip dispatched.')
  const cancelTrip = (t: Trip) =>
    doAction(() => TripsApi.cancel(t.id), t.id, 'Trip cancelled — vehicle & driver restored.')
  const openComplete = (t: Trip) => {
    setCompleteTrip(t)
    setCompleteForm({ finalOdometer: 0, fuelConsumed: 0, revenue: 0 })
  }
  const submitComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!completeTrip) return
    const t = completeTrip
    setCompleteTrip(null)
    await doAction(
      () =>
        TripsApi.complete(t.id, {
          finalOdometer: Number(completeForm.finalOdometer),
          fuelConsumed: Number(completeForm.fuelConsumed),
          revenue: completeForm.revenue ? Number(completeForm.revenue) : undefined,
        }),
      t.id,
      'Trip completed — vehicle & driver set to AVAILABLE.',
    )
  }

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
            {boardMsg ? (
              <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70">{boardMsg}</div>
            ) : null}
            {boardLoading ? (
              <div className="py-8 text-center text-sm text-white/40 animate-pulse">Loading trips…</div>
            ) : boardError ? (
              <div className="py-8 text-center text-sm text-[#ff8a84]">{boardError}</div>
            ) : trips.length === 0 ? (
              <div className="py-8 text-center text-sm text-white/40">No trips yet — dispatch one to see it here.</div>
            ) : (
              <div className="space-y-3">
                {trips.map((t) => (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSummaryTrip(t)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSummaryTrip(t)
                      }
                    }}
                    className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.02] p-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-white/25"
                  >
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
                    {canWrite && (t.status === 'DRAFT' || t.status === 'DISPATCHED') ? (
                      <div className="mt-3 flex items-center gap-2">
                        {t.status === 'DRAFT' ? (
                          <button onClick={(e) => { e.stopPropagation(); dispatchExisting(t) }} disabled={busyId === t.id} className="rounded-md bg-[#e0972a] px-3 py-1 text-xs font-semibold text-black hover:bg-[#f0a838] disabled:opacity-50">Dispatch</button>
                        ) : null}
                        {t.status === 'DISPATCHED' ? (
                          <button onClick={(e) => { e.stopPropagation(); openComplete(t) }} disabled={busyId === t.id} className="rounded-md bg-[#28c840] px-3 py-1 text-xs font-semibold text-black hover:bg-[#3ad653] disabled:opacity-50">Complete</button>
                        ) : null}
                        <button onClick={(e) => { e.stopPropagation(); cancelTrip(t) }} disabled={busyId === t.id} className="rounded-md border border-white/15 px-3 py-1 text-xs text-white/70 hover:bg-white/5 disabled:opacity-50">
                          {busyId === t.id ? '…' : 'Cancel'}
                        </button>
                      </div>
                    ) : null}
                    <div className="mt-2 text-[10px] text-white/25">Click for trip summary</div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <Modal open={!!completeTrip} onClose={() => setCompleteTrip(null)} title="Complete trip">
        <form className="space-y-3" onSubmit={submitComplete}>
          <p className="text-xs text-white/50">
            {completeTrip?.source} → {completeTrip?.destination}. Records final odometer + fuel; vehicle &amp; driver return to AVAILABLE.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Final odometer (km)">
              <input required type="number" min={0} value={completeForm.finalOdometer} onChange={(e) => setCompleteForm({ ...completeForm, finalOdometer: Number(e.target.value) })} className={fieldInputCls} />
            </FormRow>
            <FormRow label="Fuel consumed (L)">
              <input required type="number" min={0} value={completeForm.fuelConsumed} onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumed: Number(e.target.value) })} className={fieldInputCls} />
            </FormRow>
          </div>
          <FormRow label="Revenue (₹, optional)">
            <input type="number" min={0} value={completeForm.revenue} onChange={(e) => setCompleteForm({ ...completeForm, revenue: Number(e.target.value) })} className={fieldInputCls} />
          </FormRow>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setCompleteTrip(null)} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5">Cancel</button>
            <button type="submit" className="rounded-lg bg-[#28c840] px-4 py-2 text-sm font-semibold text-black hover:bg-[#3ad653]">Complete trip</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!summaryTrip} onClose={() => setSummaryTrip(null)} title="Trip summary">
        {summaryTrip ? <TripSummary trip={summaryTrip} /> : null}
      </Modal>
    </div>
  )
}

function TripSummary({ trip }: { trip: Trip }) {
  const isCompleted = trip.status === 'COMPLETED'
  const efficiency =
    trip.fuelConsumed && trip.fuelConsumed > 0
      ? (trip.plannedDistance / trip.fuelConsumed).toFixed(2)
      : null

  const currency = (n?: number | null) =>
    typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—'

  return (
    <div className="space-y-4">
      {/* Header: route + status */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">
            {trip.source} → {trip.destination}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-white/35">
            #{trip.id.slice(0, 8)}
          </div>
        </div>
        <StatusBadge tone={TRIP_TONE[trip.status]} label={trip.status} />
      </div>

      {/* Lifecycle position */}
      <div className="flex items-center gap-1.5">
        {LIFECYCLE.filter((s) => !(trip.status === 'CANCELLED' && (s.label === 'Dispatched' || s.label === 'Completed')))
          .map((s) => s.label.toUpperCase())
          .map((label, i, arr) => {
            const active = label === trip.status
            return (
              <span key={label} className="flex items-center gap-1.5">
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                    active ? 'bg-white/15 text-white' : 'bg-white/5 text-white/35'
                  }`}
                >
                  {label}
                </span>
                {i < arr.length - 1 ? <span className="text-white/20">→</span> : null}
              </span>
            )
          })}
      </div>

      {/* Assignment */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
        <KeyValue
          label="Vehicle"
          value={
            trip.vehicle ? `${trip.vehicle.name} · ${trip.vehicle.regNo}` : 'Unassigned'
          }
        />
        <KeyValue
          label="Driver"
          value={
            trip.driver ? `${trip.driver.name} · ${trip.driver.licenseNo}` : 'Unassigned'
          }
        />
        <KeyValue label="Cargo weight" value={`${trip.cargoWeight.toLocaleString()} kg`} />
        <KeyValue label="Planned distance" value={`${trip.plannedDistance} km`} />
        <KeyValue
          label="Created"
          value={new Date(trip.createdAt).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        />
      </div>

      {/* Completion details */}
      {isCompleted ? (
        <div className="rounded-lg border border-[#28c840]/25 bg-[#28c840]/[0.05] p-3">
          <div className="mb-1.5 text-[10px] uppercase tracking-widest text-[#4ade80]">
            Completion record
          </div>
          <KeyValue
            label="Final odometer"
            value={trip.finalOdometer != null ? `${trip.finalOdometer.toLocaleString()} km` : '—'}
          />
          <KeyValue
            label="Fuel consumed"
            value={trip.fuelConsumed != null ? `${trip.fuelConsumed.toLocaleString()} L` : '—'}
          />
          <KeyValue label="Fuel efficiency" value={efficiency ? `${efficiency} km/l` : '—'} />
          <KeyValue label="Revenue" value={currency(trip.revenue)} />
        </div>
      ) : (
        <p className="text-xs text-white/40">
          {trip.status === 'DRAFT'
            ? 'This trip is a draft — dispatch it to set the vehicle and driver to ON_TRIP.'
            : trip.status === 'DISPATCHED'
              ? 'In progress. Completion will record final odometer, fuel, and revenue.'
              : 'Trip cancelled — vehicle and driver were restored to AVAILABLE.'}
        </p>
      )}
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
