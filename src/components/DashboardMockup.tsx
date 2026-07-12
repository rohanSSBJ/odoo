import { motion } from 'motion/react'
import {
  Sparkles,
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Search,
  Reply,
  Forward,
  Archive,
  Trash2,
  MoreHorizontal,
  Paperclip,
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', count: null, active: false },
  { icon: Route, label: 'Trips', count: 12, active: true },
  { icon: Truck, label: 'Vehicles', count: 3, active: false },
  { icon: Users, label: 'Drivers', count: null, active: false },
  { icon: Wrench, label: 'Maintenance', count: 2, active: false },
  { icon: Fuel, label: 'Fuel & Expenses', count: null, active: false },
  { icon: BarChart3, label: 'Analytics', count: null, active: false },
]

const statusDots = [
  { label: 'On trip', color: '#00d2ff' },
  { label: 'Available', color: '#A4F4FD' },
  { label: 'In shop', color: '#f59e0b' },
  { label: 'Retired', color: '#10b981' },
]

const trips = [
  {
    name: 'TRP-2041 · Linehaul',
    subject: 'Chicago → Detroit',
    preview: 'MAN-8842 · D. Okafor · 12,400 kg · dispatched...',
    time: '9:41 AM',
    unread: true,
    active: true,
  },
  {
    name: 'TRP-2040 · Regional',
    subject: 'Dallas → Houston',
    preview: 'VOL-1123 · S. Chen · cargo within capacity...',
    time: '8:12 AM',
    unread: true,
    active: false,
  },
  {
    name: 'TRP-2039 · Delivery',
    subject: 'Phoenix → Tucson',
    preview: 'Marcus flagged a route change on this leg.',
    time: 'Yesterday',
    unread: false,
    active: false,
  },
  {
    name: 'TRP-2038 · Linehaul',
    subject: 'Denver → Salt Lake',
    preview: 'Completed · final odometer + fuel recorded.',
    time: 'Yesterday',
    unread: false,
    active: false,
  },
  {
    name: 'TRP-2037 · Regional',
    subject: 'Seattle → Portland',
    preview: 'Vehicle returned to AVAILABLE pool.',
    time: 'Mon',
    unread: false,
    active: false,
  },
  {
    name: 'TRP-2036 · Delivery',
    subject: 'Atlanta → Savannah',
    preview: 'Cancelled · driver + vehicle restored.',
    time: 'Mon',
    unread: false,
    active: false,
  },
]

export function DashboardMockup() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e1014]/90 backdrop-blur-2xl"
      >
        {/* Title bar */}
        <div className="h-10 flex items-center px-4 border-b border-white/10 relative">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
          </div>
          <span className="absolute left-1/2 -translate-x-1/2 text-xs text-white/50">
            TransitOps — Dispatch
          </span>
        </div>

        {/* Body */}
        <div className="grid grid-cols-12 h-[520px]">
          {/* Sidebar */}
          <div className="col-span-3 border-r border-white/10 bg-black/30 p-4 flex flex-col gap-4 overflow-hidden">
            <button className="inline-flex items-center gap-2 rounded-lg bg-white text-black text-xs font-semibold px-3 py-2">
              <Sparkles className="w-3.5 h-3.5" />
              New dispatch
            </button>

            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs cursor-pointer transition-colors ${
                      item.active
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate flex-1">{item.label}</span>
                    {item.count != null && (
                      <span className="text-[10px] text-white/40">{item.count}</span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-2">
              <p className="text-[10px] uppercase tracking-wider text-white/40 px-2.5 mb-2">
                Status
              </p>
              <div className="flex flex-col gap-1.5">
                {statusDots.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center gap-2.5 px-2.5 py-1 text-xs text-white/60"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: s.color }}
                    />
                    {s.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trip list */}
          <div className="col-span-4 border-r border-white/10 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-4 h-12 border-b border-white/10 text-white/40">
              <Search className="w-3.5 h-3.5" />
              <span className="text-xs">Search trips</span>
            </div>
            <div className="flex-1 overflow-hidden">
              {trips.map((t) => (
                <div
                  key={t.name}
                  className={`px-4 py-3 border-b border-white/5 cursor-pointer transition-colors ${
                    t.active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {t.unread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] shrink-0" />
                      )}
                      <span
                        className={`text-xs truncate ${
                          t.unread ? 'text-white font-semibold' : 'text-white/70'
                        }`}
                      >
                        {t.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/40 shrink-0">{t.time}</span>
                  </div>
                  <p
                    className={`text-xs mt-1 truncate ${
                      t.unread ? 'text-white/80' : 'text-white/50'
                    }`}
                  >
                    {t.subject}
                  </p>
                  <p className="text-[11px] mt-0.5 text-white/40 truncate">
                    {t.preview}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Reader */}
          <div className="col-span-5 flex flex-col overflow-hidden">
            <div className="flex items-center gap-1 px-4 h-12 border-b border-white/10">
              {[Reply, Forward, Archive, Trash2].map((Icon, i) => (
                <button
                  key={i}
                  className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center text-white/70"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
              <div className="flex-1" />
              <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center text-white/70">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden p-5">
              <h3 className="text-lg font-semibold">TRP-2041 · Chicago → Detroit</h3>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00d2ff] to-[#0B2551] flex items-center justify-center text-xs font-semibold">
                  D
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Dispatched by Fleet Manager</p>
                  <p className="text-xs text-white/50">
                    D. Okafor · MAN-8842 · 9:41 AM
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-white/60">
                  Linehaul
                </span>
              </div>

              <div className="liquid-glass rounded-lg p-3 mt-5 flex gap-2.5">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#A4F4FD' }} />
                <div>
                  <p className="text-xs font-semibold">Summary by TransitOps</p>
                  <p className="text-xs text-white/60 mt-1 leading-[1.5]">
                    Cargo 12,400 kg is within the vehicle's 15,000 kg max load.
                    Driver license valid, safety score 94. Vehicle and driver set
                    to ON_TRIP. No action needed.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-xs text-white/70 leading-[1.6]">
                <p>Planned distance: 452 km · Est. fuel: 168 L</p>
                <p>
                  The dispatch transaction atomically moved MAN-8842 out of the
                  available pool and flagged driver D. Okafor as on trip. Both will
                  return to AVAILABLE automatically on completion.
                </p>
                <p>
                  Revenue and final odometer are captured at completion to feed the
                  ROI and fuel-efficiency KPIs on the analytics dashboard.
                </p>
                <p className="text-white/50">— TransitOps dispatch engine</p>
              </div>

              <div className="mt-5 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-xs text-white/70">
                <Paperclip className="w-3.5 h-3.5" />
                trip-manifest-trp-2041.pdf
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
