import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  Truck,
  Users,
  Route as RouteIcon,
  Wrench,
  Fuel,
  BarChart3,
  Settings as SettingsIcon,
  Search,
  Menu,
  LogOut,
} from 'lucide-react'
import { LogoMark } from '../components/primitives'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/fleet', label: 'Fleet', icon: Truck },
  { to: '/drivers', label: 'Drivers', icon: Users },
  { to: '/trips', label: 'Trips', icon: RouteIcon },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/fuel-expenses', label: 'Fuel & Expenses', icon: Fuel },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <LogoMark className="w-6 h-6" />
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight">TransitOps</div>
          <div className="text-[9px] uppercase tracking-widest text-white/35">Ops Platform</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/55 hover:bg-white/5 hover:text-white/80'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => navigate('/login')}
        className="m-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/55 transition-colors hover:bg-white/5 hover:text-white/80"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign out</span>
      </button>
    </div>
  )

  return (
    <div className="relative min-h-screen bg-[#0c0c0c] text-white">
      {/* subtle ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          background:
            'radial-gradient(700px circle at 12% -5%, rgba(61,129,227,0.12), transparent 60%)',
        }}
      />

      <div className="relative z-10 flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-white/10 bg-black/40 backdrop-blur-xl">
          {SidebarInner}
        </aside>

        {/* Mobile drawer */}
        {open ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-60 border-r border-white/10 bg-[#0c0c0c]">
              {SidebarInner}
            </aside>
          </div>
        ) : null}

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-black/40 px-4 backdrop-blur-xl">
            <button
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5"
              onClick={() => setOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-white/30" />
              <input
                placeholder="Search..."
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
              />
            </div>

            <div className="ml-auto flex items-center gap-3">
              <span className="hidden sm:block text-sm text-white/60">Raven K.</span>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-3 pr-1">
                <span className="text-xs text-white/70">Dispatcher</span>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#00d2ff] to-[#0B2551] text-[10px] font-semibold">
                  RK
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
