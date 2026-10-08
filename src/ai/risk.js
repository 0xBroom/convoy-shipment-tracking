import { DOCUMENT_LABELS } from '../data/documents.js'
import { INCIDENTS } from '../data/incidents.js'
import { SITES_BY_ID } from '../data/sites.js'
import { fmtDuration, hoursSince } from '../lib/format.js'
import { isDelivered, lastEvent, openHold } from '../lib/shipment.js'

// Rule weights. Same inputs always give the same score and the same ranking.
const WEIGHTS = {
  slipPerDay: 2, // ETA slip: +2 per day, rounded, capped below
  slipCap: 6,
  customsHold: 4,
  stale: 3,
  staleChased: 1, // operator contacted within the last 24 h
  documentMissing: 2,
  documentRejected: 3,
  incident: 4,
  unmappedStatus: 1,
}

const STALE_AFTER_HOURS = 24

// view needs: legs, timeline, documents, flags, estimate (from estimateArrival)
// and `lastContactAt` (Date or null, from the ops activity log).
export function scoreRisk(view, now) {
  const reasons = []
  const tags = []
  const actions = []
  const add = (tag, text, weight) => {
    reasons.push({ text, weight })
    if (tag && !tags.includes(tag)) tags.push(tag)
  }

  if (isDelivered(view)) return { level: 'none', score: 0, reasons, tags, actions, nextAction: null }

  const incident = unresolvedIncident(view)
  const slipHours = view.estimate?.moved ? view.estimate.delayHours : 0
  const slipWeight = Math.min(
    WEIGHTS.slipCap,
    Math.round((slipHours / 24) * WEIGHTS.slipPerDay),
  )
  if (slipWeight > 0) add('delay', `${delayCause(view)} ${fmtDuration(slipHours)}`, slipWeight)

  const hold = openHold(view)
  if (hold) add('customs_hold', `Held at customs, ${hold.location}`, WEIGHTS.customsHold)

  const last = lastEvent(view)
  const silentHours = last ? hoursSince(last.at, now) : null
  let awaiting = false
  if (silentHours !== null && silentHours > STALE_AFTER_HOURS) {
    const silent = `No confirmed event for ${Math.floor(silentHours)} h`
    awaiting = view.lastContactAt != null && hoursSince(view.lastContactAt, now) <= 24
    if (awaiting) add('stale', `${silent}, operator contacted`, WEIGHTS.staleChased)
    else add('stale', silent, WEIGHTS.stale)
  }

  const rejected = view.documents.filter((d) => d.status === 'rejected')
  const missing = view.documents.filter((d) => d.status === 'missing')
  for (const doc of rejected) add('missing_document', `${DOCUMENT_LABELS[doc.type]} rejected`, WEIGHTS.documentRejected)
  for (const doc of missing) add('missing_document', `${DOCUMENT_LABELS[doc.type]} missing`, WEIGHTS.documentMissing)

  if (incident) {
    add('port_incident', `Port incident, ${SITES_BY_ID[incident.siteId].city}`, WEIGHTS.incident)
  }
  if (last && !last.recognised) add(null, 'Last operator status not mapped', WEIGHTS.unmappedStatus)

  // Proposed actions in precedence order: a rejected document blocks customs,
  // so it comes first; then telling the customer; then the remaining asks.
  for (const doc of rejected) actions.push({ type: 'request_document', docType: doc.type })
  if (incident || slipHours >= 24) actions.push({ type: 'notify' })
  for (const doc of missing) actions.push({ type: 'request_document', docType: doc.type })
  if (hold && !rejected.length && !missing.length) actions.push({ type: 'contact_operator' })
  if (tags.includes('stale')) {
    const type = awaiting ? 'awaiting_operator' : 'contact_operator'
    if (!actions.some((a) => a.type === type)) actions.push({ type })
  }
  if (!actions.length && slipWeight > 0) actions.push({ type: 'notify' })

  const score = reasons.reduce((sum, r) => sum + r.weight, 0)
  return {
    level: levelOf(score),
    score,
    reasons,
    tags,
    actions,
    nextAction: actions[0]?.type ?? null,
  }
}

export function levelOf(score) {
  if (score >= 6) return 'high'
  if (score >= 3) return 'medium'
  if (score >= 1) return 'low'
  return 'none'
}

export const RISK_LABELS = { high: 'High', medium: 'Medium', low: 'Low', none: 'None' }

// Highest score first; ties by earlier planned arrival, then order number.
export function rankByRisk(views) {
  return [...views].sort(
    (a, b) =>
      b.risk.score - a.risk.score ||
      new Date(a.promisedAt) - new Date(b.promisedAt) ||
      a.id.localeCompare(b.id),
  )
}

function unresolvedIncident(view) {
  const incident = INCIDENTS[view.flags.incidentId]
  return incident && !incident.resolved ? incident : null
}

// Names the mode that caused the delay: the confirmed delay events first,
// customs time when it is the only source.
function delayCause(view) {
  const delayed = view.timeline.find((e) => e.delayHours > 0)
  if (!delayed) return 'Customs delay'
  return view.legs[delayed.legIndex].mode === 'sea' ? 'Vessel delay' : 'Road delay'
}
