import { motion } from 'motion/react'
import { Search } from 'lucide-react'
import { LogoMark } from './primitives'

const menuItems = ['File', 'Fleet', 'Dispatch', 'Reports', 'Window', 'Help']

const now = new Date().toLocaleString('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export function MenuBar() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.9, ease: 'easeOut' }}
      className="h-10 bg-black/40 backdrop-blur-md border-t border-b border-white/10"
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between text-xs">
        <div className="flex items-center gap-5">
          <LogoMark className="w-3.5 h-3.5" />
          <span className="font-bold text-white">TransitOps</span>
          <div className="flex items-center gap-5 text-white/70">
            {menuItems.map((item, i) => (
              <span
                key={item}
                className={
                  i > 3 ? 'hidden md:inline' : i > 2 ? 'hidden sm:inline' : ''
                }
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 text-white/70">
          <Search className="w-3.5 h-3.5" />
          <span>{now}</span>
        </div>
      </div>
    </motion.div>
  )
}
