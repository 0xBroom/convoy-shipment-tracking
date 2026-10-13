import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { describeAction } from '../../ai/summary.js'
import { ActionButton, ActionStates } from '../../components/ActionButtons.jsx'
import AiStamp, { Why } from '../../components/AiStamp.jsx'
import DocumentList from '../../components/DocumentList.jsx'
import Estimate, { EstimatedTime } from '../../components/Estimate.jsx'
import NotFound from '../../components/NotFound.jsx'
import RiskLevel from '../../components/RiskLevel.jsx'
import RouteTimeline from '../../components/RouteTimeline.jsx'
import StatusSwatch from '../../components/StatusSwatch.jsx'
import { NOW } from '../../data/now.js'
import { documentActionType } from '../../lib/documents.js'
import { fmtDateTime } from '../../lib/format.js'
import { routeSentence } from '../../lib/route.js'
import { isDelivered, lastEvent } from '../../lib/shipment.js'
import { buildTimeline, eventLabel } from '../../lib/timeline.js'
import { selectActivity, selectShipmentView } from '../../store/selectors.js'
import { useLiveEventId, useSelector } from '../../store/useStore.js'
import './OpsShipmentDetail.css'

// Hover or focus on an event on either side lights up its counterpart through
// one shared id (the event id the timeline rows also carry as data-event-id).
function hooks(id, setActive) {
  return {
    tabIndex: 0,
    onMouseEnter: () => setActive(id),
    onMouseLeave: () => setActive(null),
    onFocus: () => setActive(id),
    onBlur: () => setActive(null),
  }
}

// On a phone the normalised column is hidden, so each raw row also carries its
// mapped milestone on a line of its own (CSS shows it below 720px only).
function RawFeed({ view, events, activeId, setActive, liveId }) {
  return (
    <section className="ops-feed" aria-labelledby="raw-heading">
      <h2 id="raw-heading">Operator feed (raw)</h2>
      <p className="ops-feed-hint">Each event as the operator sent it.</p>
      <ol className="ops-events">
        {events.map((e) => (
          <li key={e.id} className="ops-event" data-event-id={e.id} data-active={e.id === activeId} data-live={e.id === liveId} {...hooks(e.id, setActive)}>
            <span className="ops-event-main">
              <span className="ops-event-operator">{e.operatorName}</span>
              <span className="ops-raw">&lsquo;{e.raw}&rsquo;</span>
              {!e.recognised && <span className="ops-unmapped">Not mapped</span>}
            </span>
            <span className="ops-event-map" data-mapped={e.recognised}>
              <span aria-hidden="true">&rarr;</span>
              <span className="visually-hidden">Convoy reads this as</span>
              {e.recognised ? (
                <>
                  <span className="ops-event-map-label">{eventLabel(view, e)}</span>
                  <span className="stamp">Convoy</span>
                </>
              ) : (
                <span className="ops-event-map-label">Not mapped</span>
              )}
            </span>
            <span className="ops-event-meta">
              {e.location}, <time dateTime={e.at.toISOString()}>{fmtDateTime(e.at)}</time>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function NormalisedFeed({ view, events, pending, activeId, setActive, liveId }) {
  return (
    <section className="ops-feed ops-norm" aria-labelledby="norm-heading">
      <h2 id="norm-heading">Convoy timeline (normalised)</h2>
      <p className="ops-feed-hint">The same events as canonical milestones.</p>
      <ol className="ops-events">
        {events.map((e) => (
          <li key={e.id} className="ops-event" data-event-id={e.id} data-active={e.id === activeId} data-live={e.id === liveId} {...hooks(e.id, setActive)}>
            <span className="ops-event-main">
              <span className="ops-milestone" data-mapped={e.recognised}>
                {eventLabel(view, e)}
              </span>
              {!e.recognised && <span className="ops-raw">&lsquo;{e.raw}&rsquo;</span>}
            </span>
            <span className="ops-event-meta">
              {e.location}, <time dateTime={e.at.toISOString()}>{fmtDateTime(e.at)}</time>
            </span>
          </li>
        ))}
        {pending.map((row) => (
          <li key={row.id} className="ops-event ops-event-pending" data-event-id={row.id}>
            <span className="ops-event-main">
              <span className="ops-milestone">{row.label}</span>
            </span>
            <span className="ops-event-meta">
              {row.location},{' '}
              <EstimatedTime kind={row.kind} at={row.at} confidence={row.confidence} source={row.source} compact />
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function RiskReasoning({ view }) {
  const { risk } = view
  const action = risk.actions.find((a) => !(a.type === 'notify' && view.notified)) ?? risk.actions[0]
  return (
    <section aria-labelledby="risk-heading">
      <div className="ops-panel-head">
        <h2 id="risk-heading">Risk reasoning</h2>
        <AiStamp variant="suggests" />
      </div>
      <p className="ops-risk-line">
        <RiskLevel level={risk.level} />
        <span>Score {risk.score}</span>
      </p>
      {risk.reasons.length === 0 ? (
        <p className="ops-quiet">No risk rules fired for this shipment.</p>
      ) : (
        <ul className="ops-reasons">
          {risk.reasons.map((reason) => (
            <li key={reason.text}>
              <span>{reason.text}</span>
              <span className="ops-weight">
                <span className="visually-hidden">Weight </span>+{reason.weight}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Why>Convoy adds the weight of every rule that fired. 6 or more is High, 3 to 5 Medium, 1 to 2 Low.</Why>
      {action && <p className="ops-proposed">{describeAction(view, action, NOW).text}</p>}
    </section>
  )
}

function Actions({ view }) {
  return (
    <section aria-labelledby="actions-heading">
      <div className="ops-panel-head">
        <h2 id="actions-heading">Actions</h2>
        <AiStamp variant="drafted" />
      </div>
      <p className="ops-quiet">Convoy drafts the message. Nothing is sent until you confirm.</p>
      <div className="ops-actions">
        <ActionButton view={view} action={{ type: 'notify' }} variant="primary" />
        <ActionButton view={view} action={{ type: 'contact_operator' }} />
      </div>
      <ActionStates view={view} />
    </section>
  )
}

export default function OpsShipmentDetail() {
  const { id } = useParams()
  const view = useSelector((state) => selectShipmentView(state, id))
  const activity = useSelector((state) => selectActivity(state, id))
  const [activeId, setActive] = useState(null)
  const liveId = useLiveEventId()

  useEffect(() => {
    document.title = view ? `Order ${view.id}, Convoy` : 'Shipment not found, Convoy'
  }, [view])

  // An unknown id and an id outside the ops perimeter look the same.
  if (!view) return <NotFound to="/ops/shipments" label="Back to portfolio" />

  const delivered = isDelivered(view)
  const pending = buildTimeline(view)
    .flatMap((leg) => leg.rows)
    .filter((row) => !row.confirmed)
  const last = lastEvent(view)
  // Send our own documents, request the other parties'.
  const documentAction = (doc) =>
    doc.status === 'missing' || doc.status === 'rejected' ? (
      <ActionButton view={view} action={{ type: documentActionType(doc.type), docType: doc.type }} />
    ) : null

  return (
    <div className="ops-detail">
      <header className="ops-detail-head">
        <div>
          <h1 className="ops-detail-order">Order {view.id}</h1>
          <p className="ops-detail-sub">
            {view.customerName}. {routeSentence(view)}.
          </p>
        </div>
        <div className="ops-detail-state">
          <StatusSwatch view={view} />
          <span className="ops-detail-risk">
            Risk <RiskLevel level={view.risk.level} />
          </span>
          {last && (
            <span className="ops-detail-updated">
              Last update <time dateTime={last.at.toISOString()}>{fmtDateTime(last.at)}</time>
            </span>
          )}
        </div>
      </header>

      <section aria-labelledby="route-heading">
        <h2 id="route-heading">Route</h2>
        <RouteTimeline view={view} activeEventId={activeId} onEventActive={setActive} />
      </section>

      <div className="ops-columns">
        <RawFeed view={view} events={view.timeline} activeId={activeId} setActive={setActive} liveId={liveId} />
        <NormalisedFeed
          view={view}
          events={view.timeline}
          pending={pending}
          activeId={activeId}
          setActive={setActive}
          liveId={liveId}
        />

        <div className="ops-rail">
          <RiskReasoning view={view} />
          <Estimate view={view} variant="card" />
          {!delivered && <Actions view={view} />}

          <section aria-labelledby="docs-heading">
            <h2 id="docs-heading">Documents</h2>
            <DocumentList documents={view.documents} renderAction={documentAction} />
          </section>

          <section aria-labelledby="past-heading">
            <h2 id="past-heading">Past actions</h2>
            {activity.length === 0 ? (
              <p className="ops-quiet">Nothing has been sent for this shipment yet.</p>
            ) : (
              <ul className="ops-log">
                {activity.map((entry) => (
                  <li key={entry.id}>
                    <time dateTime={entry.at}>{fmtDateTime(entry.at)}</time>
                    <span>{entry.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
