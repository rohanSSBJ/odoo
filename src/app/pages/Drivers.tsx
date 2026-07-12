import { useState } from 'react'
import { Plus, Search, ShieldCheck, ShieldAlert, Clock } from 'lucide-react'
import {
  Card,
  PageHeader,
  StatusBadge,
  ActionButton,
  RuleNote,
  SectionCard,
  StateFlow,
  Progress,
} from '../ui'
import type { StatusTone } from '../ui'

type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED'

const STATUS_META: Record<DriverStatus, { tone: StatusTone; label: string }> = {
  AVAILABLE: { tone: 'available', label: 'Available' },
  ON_TRIP: { tone: 'ontrip', label: 'On Trip' },
  OFF_DUTY: { tone: 'offduty', label: 'Off Duty' },
  SUSPENDED: { tone: 'suspended', label: 'Suspended' },
}

type License = 'valid' | 'expiring' | 'expired'

const DRIVERS: {
  name: string
  license: string
  category: string
  expiry: string
  licenseState: License
  contact: string
  safety: number
  status: DriverStatus
  assignable: boolean
}[] = [
  { name: 'Alex Mathew', license: 'DL-8821', category: 'LMV', expiry: 'Dec 2028', licenseState: 'valid', contact: '+91 98765·····', safety: 96, status: 'AVAILABLE', assignable: true },
  { name: 'John Baptist', license: 'DL-4420', category: 'HMV', expiry: 'Mar 2025', licenseState: 'expired', contact: '+91 98220·····', safety: 74, status: 'SUSPENDED', assignable: false },
  { name: 'Priya Nair', license: 'DL-7703', category: 'LMV', expiry: 'Aug 2027', licenseState: 'valid', contact: '+91 99180·····', safety: 99, status: 'ON_TRIP', assignable: false },
  { name: 'Suresh Rao', license: 'DL-9004', category: 'HMV', expiry: 'Jul 2026', licenseState: 'expiring', contact: '+91 97440·····', safety: 88, status: 'OFF_DUTY', assignable: true },
]

const LICENSE_META: Record<License, { label: string; cls: string }> = {
  valid: { label: 'Valid', cls: 'text-[#4ade80]' },
  expiring: { label: 'Expiring soon', cls: 'text-[#fbbf24]' },
  expired: { label: 'Expired', cls: 'text-[#ff8a84]' },
}

function safetyColor(n: number) {
  if (n >= 90) return '#28c840'
  if (n >= 80) return '#f59e0b'
  return '#ff5f57'
}

export function Drivers() {
  const [q, setQ] = useState('')
  const rows = DRIVERS.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers & Safety Profiles"
        subtitle="License validity, safety scores, and duty status — the Safety Officer's compliance surface."
        action={
          <ActionButton>
            <Plus className="w-4 h-4" /> Add Driver
          </ActionButton>
        }
      />

      {/* Compliance summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary icon={ShieldCheck} tone="green" value="45" label="Compliant drivers" />
        <Summary icon={Clock} tone="amber" value="3" label="Expiring in 30 days" />
        <Summary icon={ShieldAlert} tone="red" value="1" label="Expired — blocked" />
        <Summary icon={ShieldCheck} tone="brand" value="91.2" label="Avg. safety score" />
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search drivers…"
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-widest text-white/35">
                <th className="px-5 py-3 font-medium">Driver</th>
                <th className="px-5 py-3 font-medium">License No.</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Expiry</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Safety Score</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Assignable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((d) => (
                <tr key={d.license} className="text-white/80 transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-medium">{d.name}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-white/60">{d.license}</td>
                  <td className="px-5 py-3.5 text-white/60">{d.category}</td>
                  <td className="px-5 py-3.5">
                    <div className="text-white/70">{d.expiry}</div>
                    <div className={`text-[10px] ${LICENSE_META[d.licenseState].cls}`}>
                      {LICENSE_META[d.licenseState].label}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-white/60">{d.contact}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <Progress value={d.safety} color={safetyColor(d.safety)} height={6} />
                      </div>
                      <span className="text-xs text-white/60">{d.safety}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge tone={STATUS_META[d.status].tone} label={STATUS_META[d.status].label} />
                  </td>
                  <td className="px-5 py-3.5">
                    {d.assignable ? (
                      <span className="text-xs text-[#4ade80]">Eligible</span>
                    ) : (
                      <span className="text-xs text-[#ff8a84]">Blocked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <li className="flex gap-2"><span className="text-[#4ade80]">✓</span> License category must match vehicle class</li>
          </ul>
          <RuleNote>
            license_no is unique · an index on license_expiry powers the expiring-license reminders shown above.
          </RuleNote>
        </SectionCard>
      </div>
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
  const map = {
    green: 'text-[#4ade80]',
    amber: 'text-[#fbbf24]',
    red: 'text-[#ff8a84]',
    brand: 'text-[#7db3ff]',
  }
  return (
    <Card className="p-4">
      <Icon className={`h-4 w-4 ${map[tone]}`} />
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-0.5 text-xs text-white/45">{label}</div>
    </Card>
  )
}
