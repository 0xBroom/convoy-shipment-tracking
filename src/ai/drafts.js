import { docLabel, documentFileName } from '../data/documents.js'
import { NOW } from '../data/now.js'
import { documentRecipient } from '../lib/documents.js'
import { fmtDate, fmtDateTime } from '../lib/format.js'
import { contactTarget } from '../lib/shipment.js'

// Message drafts are templates over facts. Convoy drafts; a person edits and
// confirms. Nothing here sends anything.

const routeOf = (view) => `${view.origin.city} to ${view.destination.city}`

// What the customer is waiting for next, from the data: the vessel, customs
// or the port formalities, or the last leg.
function nextMilestone(view) {
  const last = view.timeline.at(-1)
  const sea = view.legs.find((l) => l.mode === 'sea')
  const discharged = view.timeline.some((e) => e.milestone === 'discharged')
  const cleared = view.timeline.some((e) => view.legs[e.legIndex]?.mode === 'customs' && e.milestone === 'cleared')
  const customs = view.legs.find((l) => l.mode === 'customs')
  if (sea && !discharged) return `the vessel is discharged at ${sea.to.replace(/ port$/, '')}`
  if (customs && !cleared) {
    return customs.formality === 'union_status'
      ? `the port releases it at ${customs.from}`
      : `customs clears it at ${customs.from}`
  }
  return last ? `the truck is out for delivery` : 'the shipment is collected'
}

// Customer notice: order, route, new estimate and confidence, cause, next update.
export function draftNotice(view, now = NOW) {
  const est = view.estimate
  const opening = `Your shipment for order ${view.id} (${routeOf(view)})`
  const nextUpdate = `We will update you by ${fmtDate(new Date(now.getTime() + 24 * 3_600_000))}, 12:00, or sooner once ${nextMilestone(view)}.`

  if (est?.moved) {
    const days = Math.round(est.delayHours / 24)
    const later = days >= 1 ? `about ${days} ${days === 1 ? 'day' : 'days'}` : `about ${Math.round(est.delayHours)} h`
    const cause = view.risk.reasons.find((r) => /delay/i.test(r.text))
    const where = view.timeline.find((e) => e.delayHours > 0)?.location
    const because = cause
      ? ` because of a ${cause.text.replace(/ \d+ (day|days|h)$/, '').toLowerCase()}${where ? ` at ${where}` : ''}`
      : ''
    const arrival = est.confirmed
      ? `New arrival time: ${fmtDateTime(est.value)} (confirmed by ${est.operatorName}).`
      : `New estimated arrival: ${fmtDateTime(est.value)} (estimate, ${est.confidence} confidence).`
    return `${opening} will arrive ${later} later than planned${because}. ${arrival} ${nextUpdate}`
  }

  const last = view.timeline.at(-1)
  return (
    `${opening} has had no confirmed update since ${last ? fmtDateTime(last.at) : 'it was booked'}. ` +
    `We are checking with the carrier and will tell you if the arrival date changes. ${nextUpdate}`
  )
}

// Request to the operator that owns a missing or rejected document.
export function draftDocumentRequest(view, docType) {
  const doc = view.documents.find((d) => d.type === docType)
  const label = docLabel(docType)
  const to = documentRecipient(view, docType)
  const when = doc.neededBy ? ` before ${doc.neededBy}` : ''
  const lead =
    doc.status === 'rejected'
      ? `the ${label} for order ${view.id} (${routeOf(view)}) was rejected on ${fmtDateTime(doc.rejectedAt)}. We need a corrected version${when}`
      : `we need the ${label} for order ${view.id} (${routeOf(view)})${when}`
  return `Hello ${to.name}, ${lead}. Please send it by reply, or tell us when we can expect it.`
}

// One of our own documents, sent with the file attached to the party that
// needs it next. A rejected document goes out as a corrected version.
export function draftDocumentSend(view, docType) {
  const doc = view.documents.find((d) => d.type === docType)
  const label = docLabel(docType)
  const to = documentRecipient(view, docType)
  const when = doc.neededBy ? `, needed before ${doc.neededBy}` : ''
  const corrected =
    doc.status === 'rejected'
      ? ` This is the corrected version, replacing the one rejected on ${fmtDateTime(doc.rejectedAt)}.`
      : ''
  return (
    `Hello ${to.name}, please find attached the ${label} for order ${view.id} (${routeOf(view)})${when}: ` +
    `${documentFileName(docType, view.id)}.${corrected} Please confirm receipt, or tell us if anything else is needed.`
  )
}

// Question to the operator that owns the last status. Quotes the raw status.
export function draftOperatorMessage(view) {
  const target = contactTarget(view)
  const { raw, location, at } = target.event
  const hold = view.risk.tags.includes('customs_hold')
  const ask = hold
    ? 'What is needed to release the shipment, and when do you expect the decision?'
    : 'Please reply with the current position and the next expected milestone.'
  return (
    `Hello ${target.operatorName}, can you confirm the status of order ${view.id} (${routeOf(view)})? ` +
    `Your last status was '${raw}' at ${location} on ${fmtDateTime(at)}. ${ask}`
  )
}
