import { Ship, Stamp, Truck } from 'lucide-react'
import { fmtDateTime } from '../lib/format.js'
import { OPERATORS_BY_ID } from '../data/operators.js'
import { legTitle } from '../lib/route.js'
import { buildTimeline } from '../lib/timeline.js'
import { useLiveEventId } from '../store/useStore.js'
import AiStamp from './AiStamp.jsx'
import { EstimatedTime } from './Estimate.jsx'
import OperatorTag from './OperatorTag.jsx'
import './RouteTimeline.css'

const MODE_ICONS = { road: Truck, sea: Ship, customs: Stamp }

// Leg widths follow planned duration, softened with a square root so a short
// customs leg still has room for its events.
function columnsOf(view) {
  return view.legs
    .map((leg) => {
      const hours = (new Date(leg.plannedArrival) - new Date(leg.plannedDeparture)) / 3_600_000
      return `minmax(180px, ${Math.max(1, Math.sqrt(hours)).toFixed(2)}fr)`
    })
    .join(' ')
}

function Node({ kind, confirmed, estimated, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`timeline-node ${className}`}
      data-kind={kind}
      data-confirmed={confirmed}
      data-estimated={estimated && !confirmed}
    />
  )
}

/*
  The memorable element: one consolidated route across every leg and operator.
  Solid ink = an operator confirmed it. Dashed = planned. Dashed with a hatch
  band = estimated by Convoy. Place shapes: circle site, square port, diamond
  customs. Each row carries a data-event-id so a raw feed can highlight it.
*/
export default function RouteTimeline({ view, activeEventId = null, onEventActive = null }) {
  const legs = buildTimeline(view)
  const liveId = useLiveEventId()
  const liveLeg = liveId ? legs.findIndex((leg) => leg.rows.some((row) => row.id === liveId)) : -1
  const estimated = legs.some((leg) => leg.estimated)
  const interactive = typeof onEventActive === 'function'

  return (
    <div className="timeline-wrap">
      <div className="timeline-scroll">
        <ol className="timeline" style={{ '--cols': columnsOf(view) }}>
          {legs.map((entry) => {
            const Icon = MODE_ICONS[entry.leg.mode]
            const lastConfirmed = entry.rows.findLastIndex((row) => row.confirmed)
            const flip = entry.index === entry.count - 1 && entry.share > 0.5
            const nowText = entry.now ? `Now, ${fmtDateTime(entry.now.at)}` : ''
            return (
              <li
                key={entry.index}
                className="timeline-leg"
                data-state={entry.state}
                data-estimated={entry.estimated}
                data-live={entry.index === liveLeg ? 'here' : entry.index === liveLeg + 1 && liveLeg !== -1 ? 'next' : undefined}
                style={{ '--share': entry.share }}
              >
                <div className="timeline-track">
                  <span className="timeline-line" aria-hidden="true" />
                  <span className="timeline-solid" aria-hidden="true" />
                  {entry.estimated && <span className="timeline-band" aria-hidden="true" />}
                  <Node {...entry.startNode} estimated={entry.estimated} />
                  {entry.endNode && <Node {...entry.endNode} estimated={estimated} className="timeline-node-end" />}
                  {entry.now && (
                    <span className="timeline-now" data-flip={flip}>
                      <span className="timeline-now-label">{nowText}</span>
                      <svg viewBox="0 0 12 8" width="12" height="8" focusable="false" aria-hidden="true">
                        <path d="M0 0h12L6 8z" fill="currentColor" />
                      </svg>
                    </span>
                  )}
                </div>

                <div className="timeline-body">
                  <p className="timeline-count">
                    Leg {entry.index + 1} of {entry.count}
                  </p>
                  <h3 className="timeline-title">
                    <Icon size={16} aria-hidden="true" />
                    {legTitle(entry.leg)}
                  </h3>
                  <p className="timeline-operator">
                    <OperatorTag name={OPERATORS_BY_ID[entry.leg.operatorId].name} />
                  </p>
                  {entry.dwell && <p className="timeline-dwell">{entry.dwell}</p>}

                  <ul className="timeline-events">
                    {entry.rows.map((row, i) => (
                      <li
                        key={row.id}
                        className="timeline-event"
                        data-event-id={row.id}
                        data-confirmed={row.confirmed}
                        data-active={row.id === activeEventId}
                        data-live={row.id === liveId}
                        tabIndex={interactive && row.confirmed ? 0 : undefined}
                        onMouseEnter={interactive ? () => onEventActive(row.id) : undefined}
                        onMouseLeave={interactive ? () => onEventActive(null) : undefined}
                        onFocus={interactive ? () => onEventActive(row.id) : undefined}
                        onBlur={interactive ? () => onEventActive(null) : undefined}
                      >
                        <span className="timeline-dot" aria-hidden="true" />
                        <span className="timeline-event-label" data-mapped={row.recognised}>
                          {row.label}
                        </span>
                        <span className="timeline-event-where">{row.location}</span>
                        <span className="timeline-event-when">
                          {row.confirmed ? (
                            <>
                              <time dateTime={row.at.toISOString()}>{fmtDateTime(row.at)}</time>
                              <span className="timeline-raw">&lsquo;{row.raw}&rsquo;</span>
                            </>
                          ) : (
                            <EstimatedTime
                              kind={row.kind}
                              at={row.at}
                              confidence={row.confidence}
                              source={row.source}
                              compact
                            />
                          )}
                        </span>
                        {i === lastConfirmed && entry.now && (
                          <span className="timeline-now-row">{nowText}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <p className="timeline-legend">
        <span className="timeline-key" data-key="confirmed" aria-hidden="true" />
        Solid: confirmed by the operator.
        <span className="timeline-key" data-key="planned" aria-hidden="true" />
        Dashed: planned, not confirmed yet.
        {estimated && (
          <>
            <span className="timeline-key" data-key="estimated" aria-hidden="true" />
            Hatched: moved by Convoy.
            <AiStamp variant="estimate" />
          </>
        )}
      </p>
    </div>
  )
}
