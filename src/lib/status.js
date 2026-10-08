import { NOW } from '../data/now.js'
import { dayKey } from './format.js'
import { isDelivered } from './shipment.js'

// The customer-facing status vocabulary. Colour only flags it; the word always
// carries it. Tones map to the status colours in tokens.css.
const STATUSES = {
  delivered: { key: 'delivered', label: 'Delivered', tone: 'cleared' },
  held: { key: 'held', label: 'Held at customs', tone: 'signal' },
  delayed: { key: 'delayed', label: 'Delayed', tone: 'amber' },
  needs_document: { key: 'needs_document', label: 'Needs a document', tone: 'amber' },
  arriving_today: { key: 'arriving_today', label: 'Arriving today', tone: 'cleared' },
  on_time: { key: 'on_time', label: 'On time', tone: 'cleared' },
}

// One status per shipment, first match wins. Derived from the view, never stored.
export function deriveStatus(view, now = NOW) {
  if (isDelivered(view)) return STATUSES.delivered
  if (view.risk.tags.includes('customs_hold')) return STATUSES.held
  if (view.risk.tags.includes('delay')) return STATUSES.delayed
  if (view.risk.tags.includes('missing_document')) return STATUSES.needs_document
  const arrival = view.estimate?.value ?? new Date(view.legs.at(-1).plannedArrival)
  return dayKey(arrival) === dayKey(now) ? STATUSES.arriving_today : STATUSES.on_time
}

// Shipments the customer should look at first.
export const needsAttention = (status) => ['held', 'delayed', 'needs_document'].includes(status.key)
