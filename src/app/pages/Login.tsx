import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { LogoMark } from '../../components/primitives'
import { useAuth } from '../../lib/auth'
import { apiError, type Role } from '../../lib/api'

// Canonical roles + their seeded demo accounts (all password: Passw0rd!)
const DEMO: { role: Role; label: string; email: string }[] = [
  { role: 'FLEET_MANAGER', label: 'Fleet Manager', email: 'manager@transitops.io' },
  { role: 'DRIVER', label: 'Driver', email: 'driver@transitops.io' },
  { role: 'SAFETY_OFFICER', label: 'Safety Officer', email: 'safety@transitops.io' },
  { role: 'FINANCIAL_ANALYST', label: 'Financial Analyst', email: 'finance@transitops.io' },
]
const DEMO_PASSWORD = 'Passw0rd!'

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [selected, setSelected] = useState<Role>('FLEET_MANAGER')
  const [email, setEmail] = useState(DEMO[0].email)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onRoleChange = (role: Role) => {
    setSelected(role)
    const found = DEMO.find((d) => d.role === role)
    if (found) setEmail(found.email)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate('/dashboard')
    } catch (err) {
      setError(apiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0c0c0c] text-white lg:grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden border-r border-white/10 bg-white/[0.02] p-12 lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              'radial-gradient(600px circle at 20% 15%, rgba(61,129,227,0.18), transparent 55%)',
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <LogoMark className="w-9 h-9" />
          <div>
            <div className="text-lg font-bold tracking-tight">TransitOps</div>
            <div className="text-xs text-white/40">Smart Transport Operations Platform</div>
          </div>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="text-sm font-medium text-white/70">One login, four roles</div>
          <ul className="mt-4 space-y-2.5 text-sm text-white/60">
            {DEMO.map((r) => (
              <li key={r.role} className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e0972a]" />
                {r.label}
              </li>
            ))}
          </ul>
          <div className="mt-10 text-[11px] uppercase tracking-widest text-white/25">
            TransitOps © 2026 · RBAC enabled
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex min-h-screen items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to your account</h1>
          <p className="mt-2 text-sm text-white/50">Enter your credentials to continue</p>

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <Field label="Demo account (RBAC role)">
              <select
                value={selected}
                onChange={(e) => onRoleChange(e.target.value as Role)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-white/25 focus:outline-none"
              >
                {DEMO.map((r) => (
                  <option key={r.role} value={r.role} className="bg-[#0c0c0c]">
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/25 focus:outline-none"
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/25 focus:outline-none"
              />
            </Field>

            {error ? (
              <div className="rounded-lg border border-[#ff5f57]/40 bg-[#ff5f57]/10 px-3 py-2.5 text-xs text-[#ff8a84]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#e0972a] py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#f0a838] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <div className="text-[11px] font-medium uppercase tracking-widest text-white/40">
              Access is scoped by role after login
            </div>
            <ul className="mt-3 space-y-1 text-xs text-white/50">
              <li>Fleet Manager → Vehicles, Maintenance</li>
              <li>Driver → Trips dispatch</li>
              <li>Safety Officer → Drivers &amp; compliance</li>
              <li>Financial Analyst → Fuel &amp; Expenses, Analytics</li>
            </ul>
            <div className="mt-3 text-[11px] text-white/35">
              Demo password: <span className="font-mono text-white/60">{DEMO_PASSWORD}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
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
