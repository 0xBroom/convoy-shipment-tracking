import './RiskTags.css'

const TAGS = {
  delay: { label: 'Delay', tone: 'amber' },
  customs_hold: { label: 'Customs hold', tone: 'signal' },
  stale: { label: 'Stale', tone: 'amber' },
  missing_document: { label: 'Missing document', tone: 'amber' },
  port_incident: { label: 'Port incident', tone: 'signal' },
}

// The reason tags of a risk result (view.risk.tags), in the order they fired.
export default function ReasonTags({ tags }) {
  return (
    <ul className="reason-tags" aria-label="Reasons">
      {tags.map((tag) => (
        <li key={tag} className="reason-tag" data-tone={TAGS[tag].tone}>
          {TAGS[tag].label}
        </li>
      ))}
    </ul>
  )
}
