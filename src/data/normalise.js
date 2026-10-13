import { MILESTONE_LABELS } from './milestones.js'

// Turns one raw operator event into the canonical shape the UI renders.
// A raw status the operator vocabulary does not know becomes 'unknown' with
// the label "Not mapped"; the raw text is kept so it can be shown as is.
// `delayHours` and `operatorEta` ride along so the AI engines do not need the
// raw event too.
export function normaliseEvent(event, operatorsById) {
  const operator = operatorsById[event.operatorId]
  const milestone = operator?.vocab[event.raw] ?? 'unknown'
  return {
    id: event.id,
    at: new Date(event.at),
    operatorId: event.operatorId,
    operatorName: operator?.name ?? event.operatorId,
    raw: event.raw,
    milestone,
    label: MILESTONE_LABELS[milestone],
    recognised: milestone !== 'unknown',
    location: event.location,
    legIndex: event.legIndex,
    delayHours: event.delayHours ?? 0,
    operatorEta: event.operatorEta ? new Date(event.operatorEta) : null,
  }
}

export function normaliseTimeline(events, operatorsById) {
  return events
    .map((event) => normaliseEvent(event, operatorsById))
    .sort((a, b) => a.at - b.at)
}
