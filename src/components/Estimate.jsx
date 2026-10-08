import { fmtDateTime } from '../lib/format.js'
import { deliveredEvent, lastEvent } from '../lib/shipment.js'
import AiStamp, { Why } from './AiStamp.jsx'
import './Estimate.css'

/*
  The ONLY place estimated or planned times are rendered (spec R7.2). A value
  Convoy computed or the order merely planned carries its word, its confidence
  and a dashed or hatched treatment; only an operator-confirmed timestamp is
  plain. No screen formats an estimate by hand.
*/

// One estimated or planned time, inline. Also used by the route timeline for
// milestones that have not happened yet.
export function EstimatedTime({ kind, at, confidence = null, source = null, compact = false }) {
  const estimated = kind === 'estimated'
  const word = estimated ? (compact ? 'Est.' : 'Estimated') : 'Planned'
  return (
    <span className="estimate" data-kind={kind} title={estimated && source ? `${source}, ${confidence} confidence` : undefined}>
      <span className="estimate-word">{word}</span>{' '}
      <time className="estimate-value" dateTime={at.toISOString()}>
        {fmtDateTime(at)}
      </time>
      {estimated && confidence && (
        <span className="estimate-confidence">
          {compact ? <span className="visually-hidden">Confidence </span> : 'Confidence '}
          {confidence}
        </span>
      )}
      {estimated && source && <span className="visually-hidden">, {source}</span>}
    </span>
  )
}

// What the arrival of a shipment is, in one place: confirmed delivery, a
// Convoy estimate, the plain plan, and the honest "No update yet" when the
// feed has gone quiet.
function arrivalOf(view) {
  const delivered = deliveredEvent(view)
  if (delivered) return { kind: 'confirmed', at: delivered.at, event: delivered }
  const estimate = view.estimate
  if (estimate?.moved) return { kind: 'estimated', at: estimate.value, estimate }
  return { kind: 'planned', at: new Date(view.legs.at(-1).plannedArrival), estimate }
}

function quietNote(view) {
  const last = lastEvent(view)
  if (!last) return 'No update yet'
  return view.risk.tags.includes('stale') ? `No update yet since ${fmtDateTime(last.at)}` : null
}

const HEADINGS = { confirmed: 'Confirmed arrival', estimated: 'Estimated arrival', planned: 'Planned arrival' }

/*
  variant: 'inline' (headers, rows), 'cell' (table cell, abbreviated) or
  'card' (the ETA card on the shipment detail).
*/
export default function Estimate({ view, variant = 'inline' }) {
  const arrival = arrivalOf(view)
  const note = arrival.kind === 'confirmed' ? null : quietNote(view)
  const estimate = arrival.estimate

  if (variant === 'card') {
    return (
      <section className="estimate-card" aria-labelledby={`estimate-${view.id}`}>
        <div className="estimate-card-head">
          <h2 id={`estimate-${view.id}`}>{HEADINGS[arrival.kind]}</h2>
          {arrival.kind === 'estimated' && <AiStamp variant="estimate" />}
        </div>

        {arrival.kind === 'confirmed' ? (
          <>
            <p className="estimate-display">
              <time dateTime={arrival.at.toISOString()}>{fmtDateTime(arrival.at)}</time>
            </p>
            <p>
              Confirmed by {arrival.event.operatorName}, {arrival.event.location}.
            </p>
          </>
        ) : (
          <>
            <p className="estimate-display" data-kind={arrival.kind}>
              <EstimatedTime kind={arrival.kind} at={arrival.at} confidence={estimate?.confidence} source={estimate?.source} />
            </p>
            {arrival.kind === 'estimated' ? (
              <>
                <Why>{estimate.rationale}</Why>
                <p className="estimate-source">
                  Source: {estimate.source} from operator events and planned legs. Planned{' '}
                  {fmtDateTime(view.promisedAt)}.
                </p>
              </>
            ) : (
              <p className="estimate-source">Source: the order plan. No delay has been reported.</p>
            )}
            {note && <p className="estimate-note">{note}.</p>}
          </>
        )}
      </section>
    )
  }

  const compact = variant === 'cell'
  return (
    <span className={`estimate-block estimate-${variant}`}>
      {arrival.kind === 'confirmed' ? (
        <time className="estimate-confirmed" dateTime={arrival.at.toISOString()}>
          {fmtDateTime(arrival.at)}
        </time>
      ) : (
        <EstimatedTime
          kind={arrival.kind}
          at={arrival.at}
          confidence={estimate?.confidence}
          source={estimate?.source}
          compact={compact}
        />
      )}
      {note && <span className="estimate-note">{note}</span>}
    </span>
  )
}
