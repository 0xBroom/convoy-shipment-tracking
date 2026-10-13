import { DOCUMENT_LABELS } from '../data/documents.js'
import { LIVE_FEED } from '../data/liveFeed.js'
import { NOW } from '../data/now.js'
import { OPERATORS_BY_ID } from '../data/operators.js'
import { SEED_ACTIVITY, SEED_NOTICES } from '../data/seed.js'
import { SHIPMENTS, SHIPMENTS_BY_ID } from '../data/shipments.js'

// The store holds facts only: what operators reported (events), what the order
// promised (plan), and what ops did (notices, document requests, messages).
// Risk, estimates, summaries and drafts are derived in selectors, never stored.
//
// `feed` is the presenter's position in the scripted live feed: how many
// events have landed, whether it is playing, and the demo-clock time of the
// last one (what the top bar shows as "Last updated"). `live` names the event
// and shipment the last one touched, for the one-off motion and row tints.
export function initialState() {
  return {
    role: 'customer',
    shipments: { byId: SHIPMENTS_BY_ID, allIds: SHIPMENTS.map((s) => s.id) },
    notices: SEED_NOTICES,
    dismissedNoticeIds: [],
    activity: SEED_ACTIVITY,
    toasts: [],
    feed: { cursor: 0, playing: false, updatedAt: NOW.toISOString() },
    live: { eventId: null, shipmentId: null },
    seq: 1, // source of ids for notices, activity entries and toasts
  }
}

const nowIso = () => NOW.toISOString()

const noticeTitle = (kind, shipmentId) =>
  kind === 'delay' ? `Order ${shipmentId} arriving later` : `Update on order ${shipmentId}`

const operatorName = (id) => OPERATORS_BY_ID[id]?.name ?? id

// Adds an activity entry and a toast in one step, so every ops action is
// logged and reported with the same name. The toast keeps the shipment id so
// it can link to the order it is about.
function record(state, { type, shipmentId, text, detail, toast }) {
  const seq = state.seq
  return {
    ...state,
    seq: seq + 1,
    activity: [{ id: `activity-${seq}`, at: nowIso(), type, shipmentId, text, detail }, ...state.activity],
    toasts: [...state.toasts, { id: `toast-${seq}`, shipmentId, text: toast }],
  }
}

function withShipment(state, shipmentId, change) {
  const shipment = state.shipments.byId[shipmentId]
  if (!shipment) return state
  return {
    ...state,
    shipments: { ...state.shipments, byId: { ...state.shipments.byId, [shipmentId]: change(shipment) } },
  }
}

export function reducer(state, action) {
  switch (action.type) {
    // Toasts belong to the role that raised them, so they do not follow it.
    case 'switchRole':
      return state.role === action.role ? state : { ...state, role: action.role, toasts: [] }

    case 'sendNotice': {
      const shipment = state.shipments.byId[action.shipmentId]
      if (!shipment) return state
      const notice = {
        id: `notice-${state.seq}`,
        shipmentId: shipment.id,
        customerId: shipment.customerId,
        kind: action.kind,
        title: noticeTitle(action.kind, shipment.id),
        text: action.text,
        sentAt: nowIso(),
        read: false,
      }
      return record(
        { ...state, notices: [notice, ...state.notices] },
        {
          type: 'notice',
          shipmentId: shipment.id,
          text: 'Notice sent to customer, Convoy inbox and email',
          detail: action.text,
          toast: 'Notice sent to customer',
        },
      )
    }

    // Document actions record the channel: operators are reached by email.
    case 'requestDocument': {
      const shipment = state.shipments.byId[action.shipmentId]
      if (!shipment?.documents.some((d) => d.type === action.docType)) return state
      const name = operatorName(action.operatorId)
      const label = DOCUMENT_LABELS[action.docType]
      const next = withShipment(state, shipment.id, (s) => ({
        ...s,
        documents: s.documents.map((d) =>
          d.type === action.docType
            ? { ...d, status: 'requested', requestedAt: nowIso(), requestedFrom: action.operatorId }
            : d,
        ),
      }))
      return record(next, {
        type: 'document',
        shipmentId: shipment.id,
        text: `${label} requested from ${name} by email`,
        detail: action.text,
        toast: `${label} requested from ${name}`,
      })
    }

    case 'sendDocument': {
      const shipment = state.shipments.byId[action.shipmentId]
      if (!shipment?.documents.some((d) => d.type === action.docType)) return state
      const name = operatorName(action.operatorId)
      const label = DOCUMENT_LABELS[action.docType]
      const next = withShipment(state, shipment.id, (s) => ({
        ...s,
        documents: s.documents.map((d) =>
          d.type === action.docType ? { ...d, status: 'sent', sentAt: nowIso(), sentTo: action.operatorId } : d,
        ),
      }))
      const attached = action.attachments?.length ? `, attached ${action.attachments.join(', ')}` : ''
      return record(next, {
        type: 'document',
        shipmentId: shipment.id,
        text: `${label} sent to ${name} by email${attached}`,
        detail: action.text,
        toast: `${label} sent to ${name}`,
      })
    }

    case 'contactOperator': {
      if (!state.shipments.byId[action.shipmentId]) return state
      const name = operatorName(action.operatorId)
      return record(state, {
        type: 'operator',
        shipmentId: action.shipmentId,
        text: `Message sent to ${name} by email`,
        detail: action.text,
        toast: `Message sent to ${name}`,
      })
    }

    // The feed only moves through these three. Nothing starts it by itself.
    case 'playFeed':
      return state.feed.cursor >= LIVE_FEED.length ? state : { ...state, feed: { ...state.feed, playing: true } }

    case 'pauseFeed':
      return { ...state, feed: { ...state.feed, playing: false } }

    // Lands the next scripted event: appends it to its shipment as a fact,
    // moves the cursor, and tells the presenter what it means. The feed stops
    // by itself after the last one.
    case 'applyFeedEvent': {
      const step = LIVE_FEED[state.feed.cursor]
      if (!step) return { ...state, feed: { ...state.feed, playing: false } }
      const { shipmentId, tone, note, ...fields } = step
      const shipment = state.shipments.byId[shipmentId]
      const id = `${shipmentId}-e${shipment.events.length + 1}`
      const next = withShipment(state, shipmentId, (s) => ({ ...s, events: [...s.events, { id, ...fields }] }))
      const cursor = state.feed.cursor + 1
      const seq = next.seq
      return {
        ...next,
        seq: seq + 1,
        feed: { cursor, playing: state.feed.playing && cursor < LIVE_FEED.length, updatedAt: fields.at },
        live: { eventId: id, shipmentId },
        toasts: [
          ...next.toasts,
          {
            id: `toast-${seq}`,
            shipmentId,
            tone,
            text: `${operatorName(fields.operatorId)} posted '${fields.raw}' at ${fields.location}`,
            detail: note,
          },
        ],
      }
    }

    case 'markNoticesRead': {
      const ids = new Set(action.ids)
      if (!state.notices.some((n) => !n.read && ids.has(n.id))) return state
      return { ...state, notices: state.notices.map((n) => (ids.has(n.id) ? { ...n, read: true } : n)) }
    }

    case 'dismissNotice':
      return state.dismissedNoticeIds.includes(action.id)
        ? state
        : { ...state, dismissedNoticeIds: [...state.dismissedNoticeIds, action.id] }

    case 'dismissToast':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }

    // Back to the seed, feed rewound. The role stays, so the presenter keeps
    // their place.
    case 'resetDemo':
      return { ...initialState(), role: state.role }

    default:
      return state
  }
}
