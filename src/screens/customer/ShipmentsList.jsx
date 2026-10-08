import { BellRing } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router'
import Estimate from '../../components/Estimate.jsx'
import StatusSwatch from '../../components/StatusSwatch.jsx'
import { routeShort } from '../../lib/route.js'
import { arrivalAt, isDelivered } from '../../lib/shipment.js'
import { deriveStatus, needsAttention } from '../../lib/status.js'
import { selectPerimeterViews } from '../../store/selectors.js'
import { useSelector } from '../../store/useStore.js'
import './ShipmentsList.css'

// Attention first, then open shipments, then delivered ones; each group by arrival.
const rank = (view) => (needsAttention(deriveStatus(view)) ? 0 : isDelivered(view) ? 2 : 1)

const sortRows = (views) =>
  [...views].sort((a, b) => rank(a) - rank(b) || arrivalAt(a) - arrivalAt(b) || a.id.localeCompare(b.id))

export default function ShipmentsList() {
  const views = useSelector(selectPerimeterViews)
  useEffect(() => {
    document.title = 'My shipments, Convoy'
  }, [])

  const rows = sortRows(views)
  const attention = rows.filter((view) => needsAttention(deriveStatus(view))).length
  const count = `${rows.length} ${rows.length === 1 ? 'shipment' : 'shipments'}`

  return (
    <div className="shipments">
      <header className="shipments-head">
        <h1>My shipments</h1>
        {rows.length > 0 && (
          <p className="shipments-count">{attention > 0 ? `${count}, ${attention} needs attention` : count}</p>
        )}
      </header>

      {rows.length === 0 ? (
        <p className="shipments-empty">No shipments yet. They appear here once your first order ships.</p>
      ) : (
        <table className="shipments-table">
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Route</th>
              <th scope="col">Status</th>
              <th scope="col">Arrival</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((view) => (
              <tr key={view.id} data-notice={view.notice ? 'true' : 'false'}>
                <td className="shipments-order">
                  <Link to={`/customer/shipments/${view.id}`}>
                    <span className="visually-hidden">Order </span>
                    {view.id}
                  </Link>
                </td>
                <td className="shipments-route">
                  <span>{routeShort(view)}</span>
                  {view.notice && (
                    <span className="shipments-notice">
                      <BellRing size={14} aria-hidden="true" />
                      Notice from Convoy
                    </span>
                  )}
                </td>
                <td className="shipments-status">
                  <StatusSwatch view={view} />
                </td>
                <td className="shipments-arrival">
                  <Estimate view={view} variant="cell" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
