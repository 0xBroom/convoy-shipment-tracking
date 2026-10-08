import { Link } from 'react-router'
import './NotFound.css'

// Empty and error states say what happened and what to do next. The default
// text is the same for a missing and for a hidden shipment, so a shipment
// outside the role's perimeter reveals nothing.
export default function NotFound({
  title = 'Shipment not found',
  message = 'Check the order number, or go back to the list.',
  to,
  label,
}) {
  return (
    <section className="not-found">
      <h1>{title}</h1>
      <p>{message}</p>
      <Link className="button" to={to}>
        {label}
      </Link>
    </section>
  )
}
