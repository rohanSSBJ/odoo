import { Check, Minus, Eye, Lock, KeyRound, ShieldCheck, Server, Timer } from 'lucide-react'
import { Card, PageHeader, SectionCard, Pill } from '../ui'

type Access = 'yes' | 'no' | 'view'

const ROLES: { role: string; responsibility: string; fleet: Access; drivers: Access; trips: Access; fuel: Access; analytics: Access }[] = [
  { role: 'Fleet Manager', responsibility: 'Fleet assets, maintenance, vehicle lifecycle', fleet: 'yes', drivers: 'view', trips: 'view', fuel: 'view', analytics: 'yes' },
  { role: 'Dispatcher', responsibility: 'Creates trips, assigns vehicles/drivers', fleet: 'view', drivers: 'view', trips: 'yes', fuel: 'no', analytics: 'view' },
  { role: 'Safety Officer', responsibility: 'Driver compliance, license validity, safety', fleet: 'no', drivers: 'yes', trips: 'view', fuel: 'no', analytics: 'view' },
  { role: 'Financial Analyst', responsibility: 'Expenses, fuel, maintenance cost, profit', fleet: 'view', drivers: 'no', trips: 'view', fuel: 'yes', analytics: 'yes' },
]

const SECURITY = [
  { icon: KeyRound, title: 'JWT authentication', detail: 'Stateless tokens via Passport; role claims drive guards.' },
  { icon: Lock, title: 'bcrypt password hashing', detail: 'Only password_hash is stored — never plaintext.' },
  { icon: ShieldCheck, title: 'RBAC authorization guards', detail: 'Per-endpoint role guards; 403 on disallowed roles.' },
  { icon: Server, title: 'Prisma parameterized queries', detail: 'SQL injection prevented; strict DTO whitelisting.' },
  { icon: Lock, title: 'CORS locked to frontend origin', detail: 'Secrets in .env, never committed to git.' },
  { icon: Timer, title: 'Rate limiting on auth', detail: '@nestjs/throttler protects login endpoints.' },
]

const inputCls =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none'

export function Settings() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & RBAC"
        subtitle="Organization defaults, role-based access control, and the security posture backing every request."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* General */}
        <SectionCard title="General" description="Organization defaults">
          <div className="space-y-4">
            <Field label="Depot Name">
              <input defaultValue="Gandhinagar Depot GJ4" className={inputCls} />
            </Field>
            <Field label="Currency">
              <select className={inputCls}>
                <option className="bg-[#0c0c0c]">INR (₹)</option>
                <option className="bg-[#0c0c0c]">USD ($)</option>
              </select>
            </Field>
            <Field label="Distance Unit">
              <select className={inputCls}>
                <option className="bg-[#0c0c0c]">Kilometers</option>
                <option className="bg-[#0c0c0c]">Miles</option>
              </select>
            </Field>
            <Field label="License expiry reminder (days)">
              <input defaultValue={30} type="number" className={inputCls} />
            </Field>
            <button className="rounded-lg bg-[#e0972a] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#f0a838]">
              Save changes
            </button>
          </div>
        </SectionCard>

        {/* RBAC matrix */}
        <Card className="p-0 overflow-hidden lg:col-span-2">
          <div className="p-5 pb-0">
            <div className="text-sm font-semibold">Role-Based Access Control</div>
            <div className="mt-0.5 text-xs text-white/40">User.role · FLEET_MANAGER · DRIVER · SAFETY_OFFICER · FINANCIAL_ANALYST</div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-widest text-white/35">
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-3 py-3 text-center font-medium">Fleet</th>
                  <th className="px-3 py-3 text-center font-medium">Drivers</th>
                  <th className="px-3 py-3 text-center font-medium">Trips</th>
                  <th className="px-3 py-3 text-center font-medium">Fuel/Exp.</th>
                  <th className="px-3 py-3 text-center font-medium">Analytics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ROLES.map((r) => (
                  <tr key={r.role} className="text-white/80">
                    <td className="px-5 py-3.5">
                      <div className="font-medium">{r.role}</div>
                      <div className="mt-0.5 text-[11px] text-white/40">{r.responsibility}</div>
                    </td>
                    <AccessCell value={r.fleet} />
                    <AccessCell value={r.drivers} />
                    <AccessCell value={r.trips} />
                    <AccessCell value={r.fuel} />
                    <AccessCell value={r.analytics} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4 border-t border-white/10 px-5 py-3 text-xs text-white/45">
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#4ade80]" /> Full access</span>
            <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-[#7db3ff]" /> Read-only</span>
            <span className="flex items-center gap-1.5"><Minus className="h-3.5 w-3.5 text-white/25" /> No access</span>
          </div>
        </Card>
      </div>

      {/* Security posture */}
      <SectionCard
        title="Security posture"
        description="Enforced at the API layer — reviewers look for these on the security rubric"
        action={<Pill tone="green"><ShieldCheck className="w-3.5 h-3.5" /> Hardened</Pill>}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.title} className="rounded-lg border border-white/10 bg-white/[0.02] p-3.5">
                <Icon className="h-4 w-4 text-[#7db3ff]" />
                <div className="mt-2.5 text-sm font-medium">{s.title}</div>
                <div className="mt-0.5 text-xs text-white/45">{s.detail}</div>
              </div>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}

function AccessCell({ value }: { value: Access }) {
  return (
    <td className="px-3 py-3.5 text-center">
      <span className="inline-flex justify-center">
        {value === 'yes' ? (
          <Check className="w-4 h-4 text-[#4ade80]" />
        ) : value === 'view' ? (
          <span className="inline-flex items-center gap-1 text-xs text-[#7db3ff]">
            <Eye className="w-3.5 h-3.5" /> View
          </span>
        ) : (
          <Minus className="w-4 h-4 text-white/25" />
        )}
      </span>
    </td>
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
