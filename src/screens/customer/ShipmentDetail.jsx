import { TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import DocumentList from '../../components/DocumentList.jsx'
import DownloadLink from '../../components/DownloadLink.jsx'
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

// A notice longer than this is clamped to three lines until opened. Three
// lines at the 64ch measure hold about 190 characters, so a text under the
// limit is never clamped. Counting characters is deterministic and needs no
// layout measurement; the cost is a toggle that reveals little when a
// borderline text happens to fit.
const LONG_NOTICE = 220

// A document the customer can download is one that exists: issued, or sent
// on to the next party. Missing, requested or rejected ones have no file.
const downloadable = (doc) => doc.status === 'ok' || doc.status === 'sent'

// Sections in spec order: header, notice banner, ETA card, route, documents.
// An unknown id and an id outside the customer's perimeter look identical.
export default function ShipmentDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const view = useSelector((state) => selectShipmentView(state, id))
  const banner = useSelector((state) => selectBannerNotice(state, id))
  const [openNoticeId, setOpenNoticeId] = useState(null)

  useEffect(() => {
    document.title = view ? `Order ${view.id}, Convoy` : 'Shipment not found, Convoy'
  }, [view])

  if (!view) return <NotFound to="/customer/shipments" label="Back to my shipments" />

  // The toggle state is keyed by notice id, so a new notice starts clamped.
  const longNotice = banner && banner.text.length > LONG_NOTICE
  const noticeOpen = banner && openNoticeId === banner.id

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
            <p className="notice-banner-text" data-clamped={longNotice && !noticeOpen}>
              {banner.text}
            </p>
            {longNotice && (
              <button
                type="button"
                className="link-button notice-banner-toggle"
                aria-expanded={noticeOpen}
                onClick={() => setOpenNoticeId(noticeOpen ? null : banner.id)}
              >
                {noticeOpen ? 'Show less' : 'Read full notice'}
              </button>
            )}
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
        <DocumentList
          documents={view.documents}
          renderAction={(doc) => (downloadable(doc) ? <DownloadLink view={view} doc={doc} /> : null)}
        />
      </section>
    </div>
  )
}
