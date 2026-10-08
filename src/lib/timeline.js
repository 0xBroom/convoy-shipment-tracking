import { NOW } from '../data/now.js'
import { fmtDuration, hoursBetween } from './format.js'
import { deliveredEvent } from './shipment.js'

/*
  The route timeline model. A leg is "done" once its terminal milestone is
  confirmed by an operator; the first leg that is not done is the current one.
  Everything not confirmed is either planned (the order's own dates) or
  estimated (Convoy moved the date because of a delay fact). The component
  only draws what this model says.
*/

const TERMINAL = { road: 'delivered', sea: 'discharged', customs: 'cleared' }

// What a leg is still waiting for, in order. Only the first one not yet
// confirmed is shown, so the timeline lists the next step, not every step.
const PENDING = { road: ['delivered'], sea: ['arrived', 'discharged'], customs: ['cleared'] }

const HOUR = 3_600_000
const LABELS = {
  delivered: 'Delivered',
  arrived: 'Arrived',
  discharged: 'Discharged',
  cleared: 'Cleared',
}

// A road leg that is not the last one ends at a port or hub, not at the
// customer. "Delivered" there would read as final delivery, so say where.
function milestoneLabel(leg, isLast, milestone, label) {
  if (milestone !== 'delivered' || isLast) return label
  return leg.toKind === 'port' ? 'Delivered to port' : 'Handed over'
}

// The same rule for a normalised event, so the ops feed reads like the route.
export function eventLabel(view, event) {
  const leg = view.legs[event.legIndex]
  return milestoneLabel(leg, event.legIndex === view.legs.length - 1, event.milestone, event.label)
}

export function buildTimeline(view, now = NOW) {
  const delivered = deliveredEvent(view) !== null
  const estimate = view.estimate
  const moved = Boolean(estimate?.moved)
  const customsIndex = view.legs.findIndex((l) => l.mode === 'customs')
  const eventDelay = view.timeline.reduce((sum, e) => sum + e.delayHours, 0)
  const customsShare = moved ? estimate.delayHours - eventDelay : 0

  const eventsOf = (i) => view.timeline.filter((e) => e.legIndex === i)
  const done = view.legs.map((leg, i) => delivered || eventsOf(i).some((e) => e.milestone === TERMINAL[leg.mode]))
  const currentIndex = done.indexOf(false)

  // Hours the plan has slipped by the time a given leg ends.
  const shiftAt = (i) => {
    const events = view.timeline.filter((e) => e.legIndex <= i).reduce((sum, e) => sum + e.delayHours, 0)
    return events + (customsIndex !== -1 && i >= customsIndex ? customsShare : 0)
  }

  return view.legs.map((leg, i) => {
    const events = eventsOf(i)
    const isLast = i === view.legs.length - 1
    const state = done[i] ? 'done' : i === currentIndex ? 'current' : 'upcoming'

    const rows = events.map((e) => ({
      id: e.id,
      confirmed: true,
      label: milestoneLabel(leg, isLast, e.milestone, e.label),
      recognised: e.recognised,
      location: e.location,
      at: e.at,
      raw: e.raw,
    }))
    const confirmedCount = rows.length

    if (!done[i]) {
      const reached = new Set(events.map((e) => e.milestone))
      const next = PENDING[leg.mode].find((m) => !reached.has(m))
      if (next) {
        const planned = new Date(leg.plannedArrival)
        const at = isLast && estimate ? estimate.value : new Date(planned.getTime() + (moved ? shiftAt(i) * HOUR : 0))
        rows.push({
          id: `${view.id}-leg${i}-${next}`,
          confirmed: false,
          label: milestoneLabel(leg, isLast, next, LABELS[next]),
          recognised: true,
          location: leg.to.replace(/ port$/, ''),
          at,
          kind: moved ? 'estimated' : 'planned',
          confidence: estimate?.confidence ?? null,
          source: estimate?.source ?? null,
        })
      }
    }

    const share = state === 'done' ? 1 : state === 'current' ? Math.min(0.92, Math.max(0.08, confirmedCount / rows.length)) : 0

    return {
      index: i,
      count: view.legs.length,
      leg,
      state,
      rows,
      share,
      estimated: state !== 'done' && moved,
      startNode: {
        kind: leg.fromKind,
        confirmed: i === 0 ? events.length > 0 || state === 'done' : done[i - 1],
      },
      endNode: isLast ? { kind: leg.toKind, confirmed: done[i] } : null,
      now: state === 'current' ? { at: now } : null,
      dwell: dwellOf(leg, events, now),
    }
  })
}

// How long the shipment sat at a port or in customs: from the first event of
// the leg until it moved on, or until now when it has not.
function dwellOf(leg, events, now) {
  if (leg.mode === 'road' || events.length === 0) return null
  const leaves = leg.mode === 'sea' ? ['departed', 'arrived', 'discharged'] : ['cleared']
  const end = events.find((e) => leaves.includes(e.milestone))
  const hours = hoursBetween(events[0].at, end ? end.at : now)
  const place = leg.from.replace(/ port$/, '')
  return `${fmtDuration(hours)} at ${place}${end ? '' : ' so far'}`
}
