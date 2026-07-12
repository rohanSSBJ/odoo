import { motion } from 'motion/react'
import { PrimaryButton, gradientStyle } from './primitives'

export function Hero() {
  return (
    <section className="pt-16 md:pt-28 pb-20 text-center flex flex-col items-center">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="text-4xl md:text-7xl font-semibold tracking-tight leading-[0.9]"
      >
        <span className="block text-white">Your fleet.</span>
        <span className="block animate-shiny" style={gradientStyle}>
          Orchestrated
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 text-white/60 max-w-md text-base leading-[1.5]"
      >
        TransitOps is the operations platform for modern logistics. It enforces
        every dispatch, maintenance, and compliance rule so your vehicles,
        drivers, and trips can never fall out of sync.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mt-10 flex flex-col items-center gap-3"
      >
        <PrimaryButton label="Sign in" to="/login" />
        <span className="text-xs text-white/40">
          Deploy on your cloud · Single instance ready
        </span>
      </motion.div>
    </section>
  )
}
