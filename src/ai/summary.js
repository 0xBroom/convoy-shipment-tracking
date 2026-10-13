import { docLabel, isShipperDocument } from '../data/documents.js'
import { INCIDENTS } from '../data/incidents.js'
import { SITES_BY_ID } from '../data/sites.js'
import { documentRecipient } from '../lib/documents.js'
import { dayKey, fmtDateTime, fmtDuration, hoursSince } from '../lib/format.js'
import { contactTarget, deliveredEvent, holdText } from '../lib/shipment.js'
import { rankByRisk } from './risk.js'

const MAX_NEXT_ACTIONS = 5
const MAX_ACTIONS_PER_SHIPMENT = 2

// Daily summary over the ops perimeter views. Each shipment is counted once,
// in this order: held at customs, stale, at risk (Medium or High). Delivered
// today is counted separately. Zero categories are omitted.
export function dailySummary(views, user, now) {
  const counts = { atRisk: 0, customsHold: 0, stale: 0, deliveredToday: 0 }
  for (const view of views) {
    const delivered = deliveredEvent(view)
    if (delivered) {
      if (dayKey(delivered.at) === dayKey(now)) counts.deliveredToday += 1
    } else if (view.risk.tags.includes('customs_hold')) counts.customsHold += 1
    else if (view.risk.tags.includes('stale')) counts.stale += 1
    else if (view.risk.level === 'high' || view.risk.level === 'medium') counts.atRisk += 1
  }

  // `parts` lets the screen render each count as a link; `sentence` is the same text.
  const parts = [
    { key: 'atRisk', count: counts.atRisk, text: `${counts.atRisk} at risk` },
    { key: 'customsHold', count: counts.customsHold, text: `${counts.customsHold} held at customs` },
    { key: 'stale', count: counts.stale, text: `${counts.stale} stale` },
    { key: 'deliveredToday', count: counts.deliveredToday, text: `${counts.deliveredToday} delivered` },
  ].filter((part) => part.count > 0)

  const sentence = parts.length
    ? `Today: ${parts.map((part) => part.text).join(', ')}.`
    : 'Nothing needs attention right now.'

  const cities = user.sites.map((id) => SITES_BY_ID[id].city)
  const why =
    `Counted from confirmed operator events, planned dates and documents for shipments ` +
    `from or to ${cities.join(' and ')}, as of ${fmtDateTime(now)}.`

  return {
    sentence,
    parts,
    counts,
    why,
    exceptionCount: views.filter((view) => view.risk.level !== 'none').length,
    nextActions: nextActions(views, now),
  }
}

// 3 to 5 items from the top of the ranked queue: the first two open actions of
// each shipment, skipping ones that are already done or only waiting.
function nextActions(views, now) {
  const items = []
  for (const view of rankByRisk(views.filter((v) => v.risk.level !== 'none'))) {
    const open = view.risk.actions.filter((a) => isOpen(view, a)).slice(0, MAX_ACTIONS_PER_SHIPMENT)
    for (const action of open) {
      items.push({ view, ...action, ...describeAction(view, action, now) })
    }
    if (items.length >= MAX_NEXT_ACTIONS) break
  }
  return items.slice(0, MAX_NEXT_ACTIONS)
}

function isOpen(view, action) {
  if (action.type === 'awaiting_operator') return false
  if (action.type === 'notify') return !view.notified
  return true
}

// View fields read here, set by the selectors: customerName, notified,
// lastContactAt, estimate, risk, timeline.
//
// One place for the wording of a proposed action, shared by Today, the queue
// and the shipment detail. Returns { text, why } for the shipment's action.
export function describeAction(view, action, now) {
  const id = view.id
  switch (action.type) {
    case 'notify': {
      const customer = view.customerName.split(' ')[0] // "Nordvik Subsidiary" reads as "Nordvik"
      return {
        text: `Notify ${customer} about order ${id}: ${delayLead(view)}`,
        why: whyOf(view),
      }
    }
    // Our own documents are sent to the party that needs them; the other
    // parties' documents are requested from their owner.
    case 'send_document':
    case 'request_document': {
      const doc = view.documents.find((d) => d.type === action.docType)
      const label = docLabel(action.docType)
      const who = documentRecipient(view, action.docType).name
      const reason =
        doc.status === 'rejected'
          ? `${label} rejected ${fmtDateTime(doc.rejectedAt)}`
          : isShipperDocument(action.docType)
            ? `${label} not sent, needed before ${doc.neededBy}`
            : `${label} missing before ${doc.neededBy}`
      const text =
        action.type === 'send_document'
          ? `Send the ${label} to ${who}, order ${id}`
          : `Request the ${label} from ${who}, order ${id}`
      return { text, why: `${capitalise(reason)}.` }
    }
    case 'awaiting_operator': {
      const target = contactTarget(view)
      return {
        text: `Awaiting ${target.operatorName} on order ${id}`,
        why: `${capitalise(staleText(view, now))}; operator contacted within 24 h.`,
      }
    }
    case 'contact_operator': {
      const target = contactTarget(view)
      const hold = view.risk.tags.includes('customs_hold')
      return {
        text: `Contact ${target.operatorName} about order ${id}`,
        why: hold ? `${holdText(view, target.event)}.` : `${capitalise(staleText(view, now))}.`,
      }
    }
    default:
      return { text: '', why: '' }
  }
}

// "vessel delay from the Tarragona port incident" or "road delay of 6 h".
function delayLead(view) {
  const delay = view.risk.reasons.find((r) => /delay/i.test(r.text))
  const incident = INCIDENTS[view.flags.incidentId]
  const cause = delay ? delay.text.replace(/ (\d+ (day|days|h))$/, '') : 'delay'
  const lower = cause.charAt(0).toLowerCase() + cause.slice(1)
  if (incident && !incident.resolved) return `${lower} from the ${SITES_BY_ID[incident.siteId].city} port incident`
  const hours = view.estimate?.delayHours ?? 0
  return `${lower} of ${fmtDuration(hours)}`
}

const whyOf = (view) =>
  `${view.risk.reasons.slice(0, 3).map((r) => r.text).join('; ')}.`

function staleText(view, now) {
  const last = view.timeline.at(-1)
  return `no confirmed event for ${Math.floor(hoursSince(last.at, now))} h`
}

const capitalise = (text) => text.charAt(0).toUpperCase() + text.slice(1)
