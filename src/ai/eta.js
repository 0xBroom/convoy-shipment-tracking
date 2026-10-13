import { fmtDateTime, hoursBetween, hoursSince } from '../lib/format.js'
import { isDelivered, lastEvent, openHold } from '../lib/shipment.js'

const HOUR = 3_600_000
const MIN_HOLD_HOURS = 12 // an open hold never promises release in less than this

// Deterministic arrival estimate. The plan (planned arrival of the last leg)
// moves only by facts in the data: delays operators confirmed, and customs
// time that exceeds what the order assumed. Nothing here is random.
//
// Returns null for delivered shipments (the confirmed delivery is shown
// instead). `moved` is false when no delay fact exists; the UI then shows the
// value as "Planned", not "Estimated".
//
// An operator can post its own ETA with a status. While that ETA stands, it
// replaces the Convoy estimate (`confirmed` is true, `source` names the
// operator) and the estimate it replaced is kept in `history`, so the reader
// can see what Convoy said and when the operator took over.
export function estimateArrival(view, now) {
  if (isDelivered(view)) return null
  const posted = standingOperatorEta(view)
  return posted ? operatorEstimate(view, posted) : convoyEstimate(view, now)
}

function convoyEstimate(view, now) {
  const baseline = new Date(view.legs.at(-1).plannedArrival)
  const eventDelay = view.timeline.reduce((sum, e) => sum + e.delayHours, 0)
  const customs = customsDelay(view, now)
  const delayHours = eventDelay + customs.hours
  const value = new Date(Math.round((baseline.getTime() + delayHours * HOUR) / HOUR) * HOUR)

  return {
    value,
    source: 'Convoy estimate',
    confirmed: false,
    operatorName: null,
    confidence: confidenceOf(view, now),
    rationale: rationaleOf(view, customs, delayHours),
    moved: delayHours > 0,
    delayHours,
    baseline,
    history: [],
  }
}

// The latest operator ETA still in force: the operator has not posted a newer
// status since, and no customs hold has opened after it.
function standingOperatorEta(view) {
  const posted = view.timeline.findLast((e) => e.operatorEta) ?? null
  if (!posted) return null
  const newer = view.timeline.findLast((e) => e.operatorId === posted.operatorId)
  const hold = openHold(view)
  return newer === posted && !(hold && hold.at > posted.at) ? posted : null
}

// The operator's time, as confirmed. The Convoy estimate as it stood when the
// operator posted is recomputed from the events before that moment and kept
// as the first history entry.
function operatorEstimate(view, posted) {
  const baseline = new Date(view.legs.at(-1).plannedArrival)
  const delayHours = Math.max(0, hoursBetween(baseline, posted.operatorEta))
  const before = { ...view, timeline: view.timeline.filter((e) => e.at < posted.at) }
  const superseded = convoyEstimate(before, posted.at)

  return {
    value: posted.operatorEta,
    source: 'Operator ETA',
    confirmed: true,
    operatorName: posted.operatorName,
    confidence: null,
    rationale:
      `${posted.operatorName} posted this arrival time with its '${posted.raw}' status ` +
      `at ${posted.location} on ${fmtDateTime(posted.at)}.`,
    moved: delayHours > 0,
    delayHours,
    baseline,
    history: [{ value: superseded.value, source: superseded.source, confidence: superseded.confidence, supersededAt: posted.at }],
  }
}

// Extra customs time beyond the plan. Without a hold: the typical upper bound
// minus the time the plan allowed. With an open hold: the typical upper bound
// minus the time already elapsed, never below the minimum.
function customsDelay(view, now) {
  const leg = view.legs.find((l) => l.mode === 'customs')
  const cleared = view.timeline.some((e) => view.legs[e.legIndex]?.mode === 'customs' && e.milestone === 'cleared')
  if (!leg || cleared) return { hours: 0, held: false, leg: null }

  const upper = leg.typicalHours[1]
  const hold = openHold(view)
  if (hold) {
    return {
      hours: Math.max(MIN_HOLD_HOURS, upper - hoursSince(hold.at, now)),
      held: true,
      leg,
    }
  }
  const allowed = hoursBetween(leg.plannedDeparture, leg.plannedArrival)
  return { hours: Math.max(0, upper - allowed), held: false, leg }
}

// What the customs leg is, in the rationale: an EU port only checks Union
// status, so its time is "port formalities", never "customs".
function customsPart({ held, leg }) {
  const union = leg.formality === 'union_status'
  if (held) {
    return union ? `the open hold at ${leg.from} pending proof of Union status` : `the open customs hold at ${leg.from}`
  }
  return union ? `typical port formalities at ${leg.from}` : `typical customs time at ${leg.from}`
}

// low: silent feed or an open hold. high: on the last leg with a fresh feed.
function confidenceOf(view, now) {
  const last = lastEvent(view)
  const stale = last ? hoursSince(last.at, now) > 24 : true
  if (stale || openHold(view)) return 'low'
  const onLastLeg = last && last.legIndex === view.legs.length - 1
  return onLastLeg ? 'high' : 'medium'
}

// Plain-language reasons built only from facts present in the data.
function rationaleOf(view, customs, delayHours) {
  if (delayHours <= 0) return 'Planned arrival from the order. No delay has been reported.'

  const parts = []
  const discharge = view.timeline.findLast((e) => e.milestone === 'discharged')
  if (discharge) {
    parts.push(`discharge at ${discharge.location} on ${fmtDateTime(discharge.at)}`)
  } else {
    const delayed = view.timeline.filter((e) => e.delayHours > 0)
    for (const e of delayed) {
      const mode = view.legs[e.legIndex].mode
      parts.push(`${mode === 'sea' ? 'vessel' : 'road'} delay at ${e.location}`)
    }
  }
  if (customs.hours > 0) parts.push(customsPart(customs))
  return `Based on ${joinParts([...new Set(parts)])}.`
}

function joinParts(parts) {
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
}
