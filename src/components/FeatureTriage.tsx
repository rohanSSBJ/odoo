import { motion } from 'motion/react'
import { SectionEyebrow } from './primitives'

const chips = [
  'Atomic dispatch',
  'License compliance',
  'Auto In-Shop',
  'Cost rollups',
]

const cards = [
  {
    title: 'Dispatch',
    count: 4,
    color: '#ffffff',
    items: ['TRP-2041 — Chicago → Detroit', 'TRP-2040 — Dallas → Houston'],
  },
  {
    title: 'Compliance',
    count: 7,
    color: '#e5e5e5',
    items: ['D. Okafor — license valid', 'S. Chen — safety score 94'],
  },
  {
    title: 'Maintenance',
    count: 18,
    color: '#a3a3a3',
    items: ['VOL-1123 — service due', 'MAN-8842 — inspection ok'],
  },
  {
    title: 'Archived',
    count: 13,
    color: '#525252',
    items: ['Completed trips · Fuel logs · Receipts'],
  },
]

export function FeatureTriage() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionEyebrow label="Dispatch" tag="Rule-native" />
          <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">
            Clear your dispatch board
            <br />
            in a single pass.
          </h2>
          <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
            TransitOps reads every trip, validates the rules, and moves the noise
            away from the signal. Cargo over capacity, expired licenses, and busy
            vehicles never make it out of the yard — the rest handles itself.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="text-xs text-white/70 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]"
              >
                {chip}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="liquid-glass rounded-2xl p-5"
        >
          <p className="text-xs text-white/50">Today · 42 trips triaged</p>
          <div className="mt-4 grid grid-cols-1 gap-3">
            {cards.map((card) => (
              <div key={card.title} className="liquid-glass rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: card.color }}
                  />
                  <span className="text-sm font-medium">{card.title}</span>
                  <span className="text-xs text-white/40">({card.count})</span>
                </div>
                <div className="mt-2 space-y-1">
                  {card.items.map((item) => (
                    <p key={item} className="text-xs text-white/50">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
