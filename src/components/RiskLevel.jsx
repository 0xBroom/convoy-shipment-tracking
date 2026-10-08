import { RISK_LABELS } from '../ai/risk.js'
import './RiskTags.css'

// Risk level as a word, coloured by level. The word carries the meaning.
export default function RiskLevel({ level }) {
  return (
    <span className="risk-level" data-level={level}>
      {RISK_LABELS[level]}
    </span>
  )
}
