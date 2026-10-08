import { estimateArrival } from '../ai/eta.js'
import { rankByRisk, scoreRisk } from '../ai/risk.js'
import { dailySummary } from '../ai/summary.js'
import { CUSTOMERS_BY_ID } from '../data/customers.js'
import { INCIDENTS } from '../data/incidents.js'
import { normaliseTimeline } from '../data/normalise.js'
import { NOW } from '../data/now.js'
import { OPERATORS_BY_ID } from '../data/operators.js'
import { USERS } from '../data/users.js'

/*
  Selectors derive everything the screens show from the store's facts.
  `selectPerimeterViews` is the ONLY entry point to shipment data: every count,
  queue row, portfolio row, search result, next action and detail lookup reads
  from it, so a shipment outside the role's perimeter cannot leak anywhere.
*/

const inPerimeter = (role, shipment) =>
  role === 'customer'
    ? shipment.customerId === USERS.customer.customerId
    : USERS.ops.sites.includes(shipment.origin.siteId) ||
      USERS.ops.sites.includes(shipment.destination.siteId)

// A view is the shipment's facts plus everything derived from them, built in
// this order: timeline, then estimate, then risk (risk reads the estimate).
const viewCache = new Map()

function buildView(state, shipment) {
  const notified = state.notices.some((n) => n.shipmentId === shipment.id && n.kind === 'delay')
  const notice = latestNotice(state.notices, shipment.id)
  const contact = state.activity.find((a) => a.type === 'operator' && a.shipmentId === shipment.id)
  const lastContactAt = contact ? new Date(contact.at) : null

  const cached = viewCache.get(shipment.id)
  if (
    cached &&
    cached.shipment === shipment &&
    cached.notified === notified &&
    cached.notice === notice &&
    cached.lastContactAt?.getTime() === lastContactAt?.getTime()
  ) {
    return cached.view
  }

  const view = {
    ...shipment,
    timeline: normaliseTimeline(shipment.events, OPERATORS_BY_ID),
    customerName: CUSTOMERS_BY_ID[shipment.customerId].name,
    notified,
    notice,
    lastContactAt,
  }
  view.estimate = estimateArrival(view, NOW)
  view.risk = scoreRisk(view, NOW)
  viewCache.set(shipment.id, { shipment, notified, notice, lastContactAt, view })
  return view
}

// Newest customer notice that is about a shipment's journey. A delivery
// receipt is a notification, not a notice that something needs attention.
function latestNotice(notices, shipmentId) {
  return (
    notices
      .filter((n) => n.shipmentId === shipmentId && n.kind !== 'delivered')
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))[0] ?? null
  )
}

// Single-entry cache: every component asks for the perimeter on each render.
let perimeterKey = null
let perimeterViews = []

export function selectPerimeterViews(state) {
  const key = [state.shipments, state.notices, state.activity, state.role]
  if (perimeterKey && key.every((part, i) => part === perimeterKey[i])) return perimeterViews
  perimeterViews = state.shipments.allIds
    .map((id) => state.shipments.byId[id])
    .filter((shipment) => inPerimeter(state.role, shipment))
    .map((shipment) => buildView(state, shipment))
  perimeterKey = key
  return perimeterViews
}

// null means "Shipment not found": unknown id or outside the perimeter.
export const selectShipmentView = (state, id) =>
  selectPerimeterViews(state).find((view) => view.id === id) ?? null

// Exclusive categories, in the same order the daily summary counts them:
// held at customs, then stale, then at risk (Medium or High).
export function categoryOf(view) {
  if (view.risk.level === 'none') return null
  if (view.risk.tags.includes('customs_hold')) return 'customsHold'
  if (view.risk.tags.includes('stale')) return 'stale'
  if (view.risk.level === 'high' || view.risk.level === 'medium') return 'atRisk'
  return null
}

// Ranked exception rows (optionally one category) and the unresolved incident
// groups with their perimeter members. Incident groups come first on screen.
export function selectExceptions(state, category = null) {
  const open = rankByRisk(selectPerimeterViews(state).filter((view) => view.risk.level !== 'none'))
  const rows = category ? open.filter((view) => categoryOf(view) === category) : open
  const groups = Object.values(INCIDENTS)
    .filter((incident) => !incident.resolved)
    .map((incident) => ({ incident, members: open.filter((view) => view.flags.incidentId === incident.id) }))
    .filter((group) => group.members.length > 0)
  return { rows, groups }
}

export const selectCustomerNotices = (state) =>
  state.notices
    .filter((n) => n.customerId === USERS.customer.customerId)
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))

export const selectUnreadCount = (state) => selectCustomerNotices(state).filter((n) => !n.read).length

// The banner on the customer detail: the shipment's latest notice unless the
// customer dismissed it in this session.
export function selectBannerNotice(state, shipmentId) {
  const notice = selectShipmentView(state, shipmentId)?.notice ?? null
  return notice && !state.dismissedNoticeIds.includes(notice.id) ? notice : null
}

// Newest first. Pass a shipment id for the log on that shipment.
export const selectActivity = (state, shipmentId = null) =>
  state.activity
    .filter((entry) => shipmentId === null || entry.shipmentId === shipmentId)
    .sort((a, b) => new Date(b.at) - new Date(a.at))

let summaryViews = null
let summary = null

export function selectDailySummary(state) {
  const views = selectPerimeterViews(state)
  if (views !== summaryViews) {
    summary = dailySummary(views, USERS.ops, NOW)
    summaryViews = views
  }
  return summary
}
