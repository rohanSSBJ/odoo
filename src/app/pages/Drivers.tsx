import { useEffect, useState } from 'react'
import { Plus, Search, ShieldCheck, ShieldAlert, Clock, Pencil } from 'lucide-react'
import {
  Card,
  PageHeader,
  StatusBadge,
  ActionButton,
  RuleNote,
  SectionCard,
  StateFlow,
  Progress,
  Modal,
  FormRow,
  fieldInputCls,
} from '../ui'
import type { StatusTone } from '../ui'
import { useAuth } from '../../lib/auth'
import {
  DriversApi,
  apiError,
  type Driver,
  type DriverStatus,
} from '../../lib/api'

const STATUS_META: Record<DriverStatus, { tone: StatusTone; label: string }> = {
  AVAILABLE: { tone: 'available', label: 'Available' },
  ON_TRIP: { tone: 'ontrip', label: 'On Trip' },
  OFF_DUTY: { tone: 'offduty', label: 'Off Duty' },
  SUSPENDED: { tone: 'suspended', label: 'Suspended' },
}
const FILTER_KEYS: (DriverStatus | 'ALL')[] = ['ALL', 'AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']
const LIMIT = 10
const WRITE_ROLES = ['SAFETY_OFFICER', 'FLEET_MANAGER']

function licenseState(expiry: string): { label: string; cls: string } {
  const t = new Date(expiry).getTime()
  const now = Date.now()
  if (t < now) return { label: 'Expired', cls: 'text-[#ff8a84]' }
  if (t < now + 30 * 864e5) return { label: 'Expiring soon', cls: 'text-[#fbbf24]' }
  return { label: 'Valid', cls: 'text-[#4ade80]' }
}
function safetyColor(n: number) {
  return n >= 90 ? '#28c840' : n >= 80 ? '#f59e0b' : '#ff5f57'
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

const emptyForm = {
  name: '',
  licenseNo: '',
  licenseCategory: 'LMV',
  licenseExpiry: '',
  contact: '',
  safetyScore: 90,
  status: 'AVAILABLE' as DriverStatus,
}

export function Drivers() {
  const { user } = useAuth()
  const canWrite = !!user && WRITE_ROLES.includes(user.role)

  const [active, setActive] = useState<DriverStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const [rows, setRows] = useState<Driver[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [allForSummary, setAllForSummary] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Driver | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const load = () => {
    setLoading(true)
    setError(null)
    DriversApi.list({
      page,
      limit: LIMIT,
      ...(active !== 'ALL' ? { status: active } : {}),
      ...(query ? { q: query } : {}),
    })
      .then((res) => {
        setRows(res.data)
        setTotal(res.meta.total)
        setTotalPages(res.meta.totalPages)
      })
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false))
  }
  const loadSummary = () => {
    DriversApi.list({ limit: 100 }).then((r) => setAllForSummary(r.data)).catch(() => {})
  }

  useEffect(load, [active, query, page])
  useEffect(loadSummary, [])

  const compliant = allForSummary.filter((d) => new Date(d.licenseExpiry).getTime() > Date.now()).length
  const expiring = allForSummary.filter((d) => {
    const t = new Date(d.licenseExpiry).getTime()
    return t > Date.now() && t < Date.now() + 30 * 864e5
  }).length
  const expired = allForSummary.filter((d) => new Date(d.licenseExpiry).getTime() < Date.now()).length
  const avgSafety = allForSummary.length
    ? (allForSummary.reduce((s, d) => s + d.safetyScore, 0) / allForSummary.length).toFixed(1)
    : '—'

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }
  const openEdit = (d: Driver) => {
    setEditing(d)
    setForm({
      name: d.name,
      licenseNo: d.licenseNo,
      licenseCategory: d.licenseCategory,
      licenseExpiry: d.licenseExpiry.slice(0, 10),
      contact: d.contact ?? '',
      safetyScore: d.safetyScore,
      status: d.status,
    })
    setFormError(null)
    setModalOpen(true)
  }
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    const body = {
      name: form.name,
      licenseNo: form.licenseNo,
      licenseCategory: form.licenseCategory,
      licenseExpiry: new Date(form.licenseExpiry).toISOString(),
      contact: form.contact || undefined,
      safetyScore: Number(form.safetyScore),
      status: form.status,
    }
    try {
      if (editing) await DriversApi.update(editing.id, body)
      else await DriversApi.create(body)
      setModalOpen(false)
      load()
      loadSummary()
    } catch (err) {
      setFormError(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers & Safety Profiles"
        subtitle="License validity, safety scores, and duty status — the Safety Officer's compliance surface."
        action={
          canWrite ? (
            <ActionButton onClick={openCreate}>
              <Plus className="w-4 h-4" /> Add Driver
            </ActionButton>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary icon={ShieldCheck} tone="green" value={String(compliant)} label="Compliant drivers" />
        <Summary icon={Clock} tone="amber" value={String(expiring)} label="Expiring in 30 days" />
        <Summary icon={ShieldAlert} tone="red" value={String(expired)} label="Expired — blocked" />
        <Summary icon={ShieldCheck} tone="brand" value={String(avgSafety)} label="Avg. safety score" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTER_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => {
              setActive(key)
              setPage(1)
            }}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              active === key
                ? 'border-white/25 bg-white/10 text-white'
                : 'border-white/10 bg-white/[0.02] text-white/55 hover:bg-white/5'
            }`}
          >
            {key === 'ALL' ? 'All' : STATUS_META[key].label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, license…"
            className="rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-widest text-white/35">
                <th className="px-5 py-3 font-medium">Driver</th>
                <th className="px-5 py-3 font-medium">License No.</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Expiry</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Safety</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Assignable</th>
                {canWrite ? <th className="px-5 py-3 font-medium"></th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-white/40 animate-pulse">Loading drivers…</td></tr>
              ) : error ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-[#ff8a84]">{error}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-white/40">No drivers match this filter.</td></tr>
              ) : (
                rows.map((d) => {
                  const lic = licenseState(d.licenseExpiry)
                  const assignable = d.status === 'AVAILABLE' && new Date(d.licenseExpiry).getTime() > Date.now()
                  return (
                    <tr key={d.id} className="text-white/80 transition-colors hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 font-medium">{d.name}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-white/60">{d.licenseNo}</td>
                      <td className="px-5 py-3.5 text-white/60">{d.licenseCategory}</td>
                      <td className="px-5 py-3.5">
                        <div className="text-white/70">{fmtDate(d.licenseExpiry)}</div>
                        <div className={`text-[10px] ${lic.cls}`}>{lic.label}</div>
                      </td>
                      <td className="px-5 py-3.5 text-white/60">{d.contact ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16"><Progress value={d.safetyScore} color={safetyColor(d.safetyScore)} height={6} /></div>
                          <span className="text-xs text-white/60">{d.safetyScore}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge tone={STATUS_META[d.status].tone} label={STATUS_META[d.status].label} />
                      </td>
                      <td className="px-5 py-3.5">
                        {assignable ? (
                          <span className="text-xs text-[#4ade80]">Eligible</span>
                        ) : (
                          <span className="text-xs text-[#ff8a84]">Blocked</span>
                        )}
                      </td>
                      {canWrite ? (
                        <td className="px-5 py-3.5">
                          <button onClick={() => openEdit(d)} className="text-white/40 hover:text-white" aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-white/40">
          <span>{total === 0 ? 'No results' : `Showing ${rows.length} of ${total} driver${total === 1 ? '' : 's'}`}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-md border border-white/10 px-2 py-1 hover:bg-white/5 disabled:opacity-40">Prev</button>
            <span className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-white">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-md border border-white/10 px-2 py-1 hover:bg-white/5 disabled:opacity-40">Next</button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Driver status" description="Driver.status state machine">
          <StateFlow
            states={[
              { label: 'Available', tone: 'available' },
              { label: 'On Trip', tone: 'ontrip' },
              { label: 'Off Duty', tone: 'offduty' },
              { label: 'Suspended', tone: 'suspended' },
            ]}
          />
        </SectionCard>
        <SectionCard title="Assignment guards" description="Enforced in TripService.dispatch()">
          <ul className="space-y-2.5 text-sm text-white/70">
            <li className="flex gap-2"><span className="text-[#ff8a84]">✗</span> Expired license → blocked from any trip</li>
            <li className="flex gap-2"><span className="text-[#ff8a84]">✗</span> Suspended status → blocked from assignment</li>
            <li className="flex gap-2"><span className="text-[#ff8a84]">✗</span> Already ON_TRIP → cannot be reassigned</li>
            <li className="flex gap-2"><span className="text-[#4ade80]">✓</span> license_no is unique (DB constraint → 422)</li>
          </ul>
          <RuleNote>An index on license_expiry powers the expiring-license reminders shown above.</RuleNote>
        </SectionCard>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit driver' : 'Add driver'}>
        <form className="space-y-3" onSubmit={save}>
          <FormRow label="Name">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldInputCls} />
          </FormRow>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="License No.">
              <input required value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} className={fieldInputCls} />
            </FormRow>
            <FormRow label="Category">
              <input required value={form.licenseCategory} onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })} className={fieldInputCls} />
            </FormRow>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="License expiry">
              <input required type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} className={fieldInputCls} />
            </FormRow>
            <FormRow label="Safety score">
              <input type="number" min={0} max={100} value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: Number(e.target.value) })} className={fieldInputCls} />
            </FormRow>
          </div>
          <FormRow label="Contact">
            <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className={fieldInputCls} />
          </FormRow>
          <FormRow label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DriverStatus })} className={fieldInputCls}>
              {(['AVAILABLE', 'OFF_DUTY', 'SUSPENDED', 'ON_TRIP'] as DriverStatus[]).map((s) => (
                <option key={s} value={s} className="bg-[#0c0c0c]">{STATUS_META[s].label}</option>
              ))}
            </select>
          </FormRow>
          {formError ? <div className="rounded-lg border border-[#ff5f57]/40 bg-[#ff5f57]/10 px-3 py-2 text-xs text-[#ff8a84]">{formError}</div> : null}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-[#e0972a] px-4 py-2 text-sm font-semibold text-black hover:bg-[#f0a838] disabled:opacity-60">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create driver'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function Summary({
  icon: Icon,
  tone,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  tone: 'green' | 'amber' | 'red' | 'brand'
  value: string
  label: string
}) {
  const map = { green: 'text-[#4ade80]', amber: 'text-[#fbbf24]', red: 'text-[#ff8a84]', brand: 'text-[#7db3ff]' }
  return (
    <Card className="p-4">
      <Icon className={`h-4 w-4 ${map[tone]}`} />
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-0.5 text-xs text-white/45">{label}</div>
    </Card>
  )
}
