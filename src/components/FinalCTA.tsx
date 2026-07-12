import { motion } from 'motion/react'
import { PrimaryButton } from './primitives'

export function FinalCTA() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="liquid-glass relative overflow-hidden rounded-3xl px-8 py-16 md:py-24 text-center"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.3,
            background:
              'radial-gradient(600px circle at 50% 0%, rgba(255,255,255,0.15), transparent 70%)',
          }}
        />
        <div className="relative">
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.02]">
            Close the spreadsheets.
            <br />
            Open your operations.
          </h2>
          <p className="mt-6 text-white/60 max-w-md mx-auto text-sm leading-[1.6]">
            Join the fleet managers, dispatchers, and operators who treat their
            operations like a system of record — not a chore.
          </p>
          <div className="mt-8 flex justify-center">
            <PrimaryButton label="Sign in" to="/login" />
          </div>
        </div>
      </motion.div>
    </section>
  )
}
