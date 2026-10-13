import { useState } from 'react'
import { fmtDateTime, fmtTimeSeconds } from '../lib/format.js'
import { deliveredEvent, lastEvent } from '../lib/shipment.js'
import AiStamp, { Why } from './AiStamp.jsx'
import './Estimate.css'

/*
  The ONLY place estimated or planned times are rendered (spec R7.2). A value
  Convoy computed or the order merely planned carries its word, its confidence
  and a dashed or hatched treatment; only an operator-confirmed timestamp is
  plain. An ETA an operator posted is an operator fact, so it is solid and
  names the operator. No screen formats an estimate by hand.
*/

const WORDS = { estimated: 'Estimated', planned: 'Planned', operator: 'Operator ETA' }

// One estimated, planned or operator-posted time, inline. Also used by the
// route timeline for milestones that have not happened yet.
export function EstimatedTime({ kind, at, confidence = null, source = null, operatorName = null, compact = false }) {
  const estimated = kind === 'estimated'
  const word = estimated && compact ? 'Est.' : WORDS[kind]
  const title = estimated && source ? `${source}, ${confidence} confidence` : kind === 'operator' ? `${source}, ${operatorName}` : undefined
  return (
    <span className="estimate" data-kind={kind} title={title}>
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
      {kind === 'operator' && operatorName && (
        <span className="estimate-confidence">
          <span className="visually-hidden">Posted by </span>
          {operatorName}
        </span>
      )}
    </span>
  )
}

// What the arrival of a shipment is, in one place: confirmed delivery, an
// operator's own ETA, a Convoy estimate, the plain plan, and the honest
// "No update yet" when the feed has gone quiet.
function arrivalOf(view) {
  const delivered = deliveredEvent(view)
  if (delivered) return { kind: 'confirmed', at: delivered.at, event: delivered }
  const estimate = view.estimate
  if (estimate?.confirmed) return { kind: 'operator', at: estimate.value, estimate }
  if (estimate?.moved) return { kind: 'estimated', at: estimate.value, estimate }
  return { kind: 'planned', at: new Date(view.legs.at(-1).plannedArrival), estimate }
}

function quietNote(view) {
  const last = lastEvent(view)
  if (!last) return 'No update yet'
  return view.risk.tags.includes('stale') ? `No update yet since ${fmtDateTime(last.at)}` : null
}

// Earlier arrival times this one replaced, newest first. Closed until a new
// entry lands while the card is on screen; then it opens by itself so the
// change is visible without a click, and stays where the reader leaves it.
// Mounted with the card even while empty, so it can see the first entry land.
function EtaHistory({ entries }) {
  const [seen, setSeen] = useState(entries.length)
  const [open, setOpen] = useState(false)
  if (entries.length > seen) {
    setSeen(entries.length)
    setOpen(true)
  }
  if (entries.length === 0) return null
  return (
    <details className="estimate-history" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>ETA history ({entries.length})</summary>
      <ul>
        {entries.map((entry) => (
          <li key={entry.supersededAt.toISOString()}>
            <time dateTime={entry.value.toISOString()}>{fmtDateTime(entry.value)}</time>
            {' · '}
            {entry.source}, {entry.confidence}
            {' · superseded '}
            <time dateTime={entry.supersededAt.toISOString()}>{fmtTimeSeconds(entry.supersededAt)}</time>
          </li>
        ))}
      </ul>
    </details>
  )
}

const HEADINGS = {
  confirmed: 'Confirmed arrival',
  operator: 'Operator ETA',
  estimated: 'Estimated arrival',
  planned: 'Planned arrival',
}

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
      <section className="estimate-card panel" aria-labelledby={`estimate-${view.id}`}>
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
              <EstimatedTime
                kind={arrival.kind}
                at={arrival.at}
                confidence={estimate?.confidence}
                source={estimate?.source}
                operatorName={estimate?.operatorName}
              />
            </p>
            {arrival.kind === 'operator' ? (
              <p className="estimate-source">
                {estimate.rationale} Planned {fmtDateTime(view.promisedAt)}.
              </p>
            ) : arrival.kind === 'estimated' ? (
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
            <EtaHistory key={view.id} entries={estimate?.history ?? []} />
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
          operatorName={estimate?.operatorName}
          compact={compact}
        />
      )}
      {note && <span className="estimate-note">{note}</span>}
    </span>
  )
}
