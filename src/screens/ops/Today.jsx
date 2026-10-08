import { useEffect } from 'react'
import { Link } from 'react-router'
import { ActionButton } from '../../components/ActionButtons.jsx'
import AiStamp, { Why } from '../../components/AiStamp.jsx'
import { SITES_BY_ID } from '../../data/sites.js'
import { USERS } from '../../data/users.js'
import { fmtDateTime, fmtLongDate } from '../../lib/format.js'
import { isDelivered } from '../../lib/shipment.js'
import { NOW } from '../../data/now.js'
import { selectActivity, selectDailySummary, selectPerimeterViews } from '../../store/selectors.js'
import { useSelector } from '../../store/useStore.js'
import './Today.css'

// Where each count in the sentence leads.
const COUNT_LINKS = {
  atRisk: '/ops/exceptions?category=atRisk',
  customsHold: '/ops/exceptions?category=customsHold',
  stale: '/ops/exceptions?category=stale',
  deliveredToday: '/ops/shipments?q=delivered%20today',
}

function SummarySentence({ summary }) {
  if (summary.parts.length === 0) return <>{summary.sentence}</>
  return (
    <>
      Today:{' '}
      {summary.parts.map((part, index) => (
        <span key={part.key}>
          <Link to={COUNT_LINKS[part.key]}>{part.text}</Link>
          {index < summary.parts.length - 1 ? ', ' : '.'}
        </span>
      ))}
    </>
  )
}

export default function Today() {
  const summary = useSelector(selectDailySummary)
  const views = useSelector(selectPerimeterViews)
  const activity = useSelector((state) => selectActivity(state)).slice(0, 5)

  useEffect(() => {
    document.title = 'Today, Convoy'
  }, [])

  const open = views.filter((view) => !isDelivered(view))
  const siteRows = USERS.ops.sites.map((id) => ({
    site: SITES_BY_ID[id],
    inTransit: open.filter((v) => v.origin.siteId === id || v.destination.siteId === id).length,
  }))

  return (
    <div className="today">
      <header className="today-summary">
        <div className="today-meta">
          <h1>{fmtLongDate(NOW)}</h1>
          <AiStamp variant="summary" />
        </div>
        <p className="today-sentence">
          <SummarySentence summary={summary} />
        </p>
        <Why>{summary.why}</Why>
      </header>

      <div className="today-grid">
        <section aria-labelledby="next-actions">
          <h2 id="next-actions">Next actions</h2>
          {summary.nextActions.length === 0 ? (
            <p className="today-empty">No actions waiting. Convoy lists them here as exceptions appear.</p>
          ) : (
            <ol className="today-actions">
              {summary.nextActions.map((item, index) => (
                <li key={`${item.view.id}-${item.type}-${item.docType ?? ''}`}>
                  <div className="today-action-text">
                    <p className="today-action-title">{item.text}</p>
                    <Why>{item.why}</Why>
                  </div>
                  <ActionButton view={item.view} action={{ type: item.type, docType: item.docType }} variant={index === 0 ? 'primary' : 'secondary'} />
                </li>
              ))}
            </ol>
          )}
          <Link className="today-all" to="/ops/exceptions">
            All {summary.exceptionCount} exceptions
          </Link>
        </section>

        <div className="today-rail">
          <section aria-labelledby="sites-heading">
            <h2 id="sites-heading">Your sites</h2>
            <dl className="today-sites">
              {siteRows.map(({ site, inTransit }) => (
                <div key={site.id}>
                  <dt>{site.name}</dt>
                  <dd>{inTransit} in transit</dd>
                </div>
              ))}
              <div>
                <dt>Delivered today</dt>
                <dd>{summary.counts.deliveredToday}</dd>
              </div>
              <div>
                <dt>Stale feeds</dt>
                <dd>{summary.counts.stale}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="activity-heading">
            <h2 id="activity-heading">Recent activity</h2>
            <ul className="today-activity">
              {activity.map((entry) => (
                <li key={entry.id}>
                  <time dateTime={entry.at}>{fmtDateTime(entry.at)}</time>
                  <span>
                    {entry.text}, <Link to={`/ops/shipments/${entry.shipmentId}`}>{entry.shipmentId}</Link>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
