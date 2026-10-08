import './OperatorTag.css'

// Who reported it. The raw status, when given, is on the title so a hover or
// a long press shows what the operator actually sent.
export default function OperatorTag({ name, raw }) {
  return (
    <span className="operator-tag" title={raw ? `${name} sent: '${raw}'` : name}>
      {name}
    </span>
  )
}
