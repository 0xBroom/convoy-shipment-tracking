import './AiStamp.css'

const VARIANTS = {
  estimate: 'Convoy estimate',
  suggests: 'Convoy suggests',
  summary: 'Convoy summary',
  drafted: 'Drafted by Convoy',
  interpreted: 'Convoy search',
}

// The one marker for simulated output: a bordered stamp, no icon. Pair it with
// <Why> on the same card so the rationale is never more than a glance away.
export default function AiStamp({ variant = 'estimate' }) {
  return <span className="stamp">{VARIANTS[variant]}</span>
}

// The "why" line under a stamped output: the rule, the inputs or the rationale.
export function Why({ children, label = 'Why' }) {
  return (
    <p className="why">
      <span className="why-label">{label}:</span> {children}
    </p>
  )
}
