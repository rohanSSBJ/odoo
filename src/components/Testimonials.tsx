import { motion } from 'motion/react'

const testimonials = [
  {
    quote:
      'TransitOps gave our dispatch team four hours of their week back. Every state change just reconciles itself — no more spreadsheet drift.',
    name: 'Parker Wilf',
    role: 'Head of Fleet Operations',
    company: 'MERCURY',
  },
  {
    quote:
      'The dispatch engine alone changed how we run the yard. Cargo over capacity or an expired license simply cannot be dispatched anymore.',
    name: 'Andrew von Rosenbach',
    role: 'Senior Logistics Program Manager',
    company: 'COHERE',
  },
  {
    quote:
      'Maintenance that actually understands vehicle state. Our fleet stopped dreading Monday morning route planning.',
    name: 'Mathies Christensen',
    role: 'Fleet Manager',
    company: 'LUNAR',
  },
]

export function Testimonials() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 border-t border-white/10">
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="liquid-glass rounded-2xl p-6"
          >
            <blockquote className="text-sm text-white/80 leading-[1.6]">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-6 pt-5 border-t border-white/10">
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="text-xs text-white/50">{t.role}</div>
              <div className="text-xs text-white font-semibold tracking-wide mt-1">
                {t.company}
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  )
}
