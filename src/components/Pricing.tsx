import { useState } from 'react'
import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type Plan = {
  tier: string
  price: string
  monthly?: string
  yearly?: string
  desc: string
  features: string[]
  pro?: boolean
}

const plans: Plan[] = [
  {
    tier: 'Free',
    price: 'Free',
    desc: 'For small operators taking their first steps off spreadsheets.',
    features: [
      'Up to 3 vehicles',
      'Basic trip dispatch',
      'Driver license tracking',
      'Manual fuel & expense logs',
      'Web and mobile access',
    ],
  },
  {
    tier: 'Standard',
    price: '$9,99/m',
    monthly: '$9,99/m',
    yearly: '$99,99/y',
    desc: 'For growing fleets that need enforced rules and real visibility.',
    features: [
      'Up to 50 vehicles',
      'Atomic dispatch engine',
      'Maintenance workflow',
      'Team roles (up to 5 members)',
      'Dashboard KPIs & charts',
    ],
  },
  {
    tier: 'Pro',
    price: '$19,99/m',
    monthly: '$19,99/m',
    yearly: '$199,99/y',
    desc: 'For carriers and 3PLs running mission-critical operations.',
    features: [
      'Unlimited vehicles',
      'Advanced analytics + CSV export',
      'ROI & fuel-efficiency KPIs',
      'Unlimited team members',
      'RBAC + audit logging',
    ],
    pro: true,
  },
]

export function Pricing() {
  const [yearly, setYearly] = useState(false)
  const navigate = useNavigate()

  return (
    <section className="c3-pricing-section">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="c3-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.5"
            numOctaves={2}
            stitchTiles="stitch"
          />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.075" />
          </feComponentTransfer>
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="overlay" />
        </filter>
      </svg>

      <div className="c3-watermark-container">
        <div className="c3-watermark-main">
          <span className="c3-watermark-line-1">Your fleet.</span>
          <span className="c3-watermark-line-2">Orchestrated</span>
        </div>
      </div>

      <div className="c3-grid">
        {plans.map((plan) => (
          <div key={plan.tier} className={`c3-card ${plan.pro ? 'c3-card-pro' : ''}`}>
            <div className="c3-tier-small">{plan.tier}</div>
            <div className="c3-tier-large">
              {plan.monthly ? (yearly ? plan.yearly : plan.monthly) : plan.price}
            </div>
            <p className="c3-desc">{plan.desc}</p>
            <ul className="c3-list">
              {plan.features.map((f) => (
                <li key={f}>
                  <span className="c3-check">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <button className="c3-btn" onClick={() => navigate('/login')}>
              Choose Plan
            </button>
          </div>
        ))}
      </div>

      <div className="c3-toggle-wrap">
        <span className="text-sm text-white/70">Yearly</span>
        <button
          type="button"
          aria-label="Toggle yearly pricing"
          className={`c3-toggle ${yearly ? 'active' : ''}`}
          onClick={() => setYearly((v) => !v)}
        >
          <span className="c3-toggle-knob" />
        </button>
      </div>
    </section>
  )
}
