import { TriangleAlert } from 'lucide-react'
import { useEffect } from 'react'
import { useParams } from 'react-router'
import DocumentList from '../../components/DocumentList.jsx'
import Estimate from '../../components/Estimate.jsx'
import NotFound from '../../components/NotFound.jsx'
import RouteTimeline from '../../components/RouteTimeline.jsx'
import StatusSwatch from '../../components/StatusSwatch.jsx'
import { fmtDateTime } from '../../lib/format.js'
import { routeSentence } from '../../lib/route.js'
import { dismissNotice } from '../../store/actions.js'
import { selectBannerNotice, selectShipmentView } from '../../store/selectors.js'
import { useDispatch, useSelector } from '../../store/useStore.js'
import './ShipmentDetail.css'

// Sections in spec order: header, notice banner, ETA card, route, documents.
// An unknown id and an id outside the customer's perimeter look identical.
export default function ShipmentDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const view = useSelector((state) => selectShipmentView(state, id))
  const banner = useSelector((state) => selectBannerNotice(state, id))

  useEffect(() => {
    document.title = view ? `Order ${view.id}, Convoy` : 'Shipment not found, Convoy'
  }, [view])

  if (!view) return <NotFound to="/customer/shipments" label="Back to my shipments" />

  return (
    <div className="detail">
      <header className="detail-head">
        <div>
          <h1 className="detail-order">Order {view.id}</h1>
          <p className="detail-route">{routeSentence(view)}</p>
        </div>
        <StatusSwatch view={view} />
      </header>

      {banner && (
        <aside className="notice-banner" aria-label="Notice from Convoy">
          <TriangleAlert size={18} aria-hidden="true" />
          <div className="notice-banner-body">
            <p className="notice-banner-text">{banner.text}</p>
            <p className="notice-banner-meta">
              Sent <time dateTime={banner.sentAt}>{fmtDateTime(banner.sentAt)}</time>. Sent by Convoy operations.
            </p>
          </div>
          <button type="button" className="button button-secondary" onClick={() => dispatch(dismissNotice(banner.id))}>
            Dismiss
          </button>
        </aside>
      )}

      <Estimate view={view} variant="card" />

      <section className="detail-section" aria-labelledby="route-heading">
        <h2 id="route-heading">Route</h2>
        <RouteTimeline view={view} />
      </section>

      <section className="detail-section" aria-labelledby="documents-heading">
        <h2 id="documents-heading">Documents</h2>
        <DocumentList documents={view.documents} />
      </section>
    </div>
  )
}
