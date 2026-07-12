import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { LogoMark, PrimaryButton } from './primitives'

const links = ['Platform', 'Dispatch', 'Analytics', 'Pricing']

export function Navbar() {
  return (
    <div className="max-w-6xl mx-auto px-6">
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex items-center justify-between py-5"
      >
        <div className="flex items-center">
          <LogoMark className="w-8 h-8" />
        </div>

        <div className="hidden md:flex gap-8">
          {links.map((link, i) => (
            <motion.a
              key={link}
              href="#"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.05, ease: 'easeOut' }}
              className="text-white/70 text-sm font-medium hover:text-white transition-colors"
            >
              {link}
            </motion.a>
          ))}
        </div>

        <div className="hidden md:block">
          <PrimaryButton label="Sign in" to="/login" />
        </div>

        <Link
          to="/login"
          aria-label="Sign in"
          className="md:hidden w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center"
        >
          <LogoMark className="w-5 h-5" />
        </Link>
      </motion.nav>
    </div>
  )
}
