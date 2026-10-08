import { NOW } from '../data/now.js'
import { dayKey } from './format.js'
import { arrivalAt, isDelivered } from './shipment.js'

// Shape shared by the dropdowns, the chips and the natural-language parser.
// `order` is parser-only (shown as a chip, no dropdown). Every control edits
// this one object; null means "not set".
export const FILTER_KEYS = ['status', 'siteId', 'destinationCountry', 'customerId', 'risk', 'window', 'order']

export const emptyFilters = () => Object.fromEntries(FILTER_KEYS.map((key) => [key, null]))

export const countActive = (filters) => FILTER_KEYS.filter((key) => filters[key] !== null).length

// Status filters read the same risk tags the exceptions queue shows, so
// "delayed" here and the Delay tag there always agree. Delivered shipments
// only match "delivered".
export const STATUS_OPTIONS = [
  { value: 'delayed', label: 'Delayed' },
  { value: 'customs_hold', label: 'Held at customs' },
  { value: 'stale', label: 'Stale' },
  { value: 'missing_doc', label: 'Missing document' },
  { value: 'delivered', label: 'Delivered' },
]

const STATUS_TAG = { delayed: 'delay', customs_hold: 'customs_hold', stale: 'stale', missing_doc: 'missing_document' }

// "medium" reads as "medium or high", the same as the search phrase "at risk".
export const RISK_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium or high' },
  { value: 'low', label: 'Low' },
]

export const WINDOW_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
]

const matchesStatus = (view, status) =>
  status === 'delivered' ? isDelivered(view) : !isDelivered(view) && view.risk.tags.includes(STATUS_TAG[status])

const matchesRisk = (view, risk) =>
  risk === 'high' ? view.risk.level === 'high' : risk === 'medium' ? ['high', 'medium'].includes(view.risk.level) : view.risk.level === 'low'

// Monday to Sunday of the week that contains `now`, as calendar day keys.
function weekBounds(now) {
  const today = new Date(`${dayKey(now)}T00:00:00Z`)
  const sinceMonday = (today.getUTCDay() + 6) % 7
  const shift = (days) => new Date(today.getTime() + days * 86_400_000).toISOString().slice(0, 10)
  return [shift(-sinceMonday), shift(6 - sinceMonday)]
}

// Window is about when the shipment arrives (or arrived): confirmed delivery,
// the moved estimate, then the plan.
function matchesWindow(view, window, now) {
  const arrival = dayKey(arrivalAt(view))
  if (window === 'today') return arrival === dayKey(now)
  const [start, end] = weekBounds(now)
  return arrival >= start && arrival <= end
}

// AND semantics across every set filter. `views` must already be the role's
// perimeter views: nothing outside it can be matched, whatever is typed.
export function applyFilters(views, filters, now = NOW) {
  return views.filter(
    (view) =>
      (filters.status === null || matchesStatus(view, filters.status)) &&
      (filters.siteId === null || [view.origin.siteId, view.destination.siteId].includes(filters.siteId)) &&
      (filters.destinationCountry === null || view.destination.country === filters.destinationCountry) &&
      (filters.customerId === null || view.customerId === filters.customerId) &&
      (filters.risk === null || matchesRisk(view, filters.risk)) &&
      (filters.window === null || matchesWindow(view, filters.window, now)) &&
      (filters.order === null || view.id === filters.order),
  )
}
