import { DOCUMENT_LABELS } from '../data/documents.js'
import { LIVE_EVENT } from '../data/liveEvent.js'
import { NOW } from '../data/now.js'
import { OPERATORS_BY_ID } from '../data/operators.js'
import { SEED_ACTIVITY, SEED_NOTICES } from '../data/seed.js'
import { SHIPMENTS, SHIPMENTS_BY_ID } from '../data/shipments.js'

// The store holds facts only: what operators reported (events), what the order
// promised (plan), and what ops did (notices, document requests, messages).
// Risk, estimates, summaries and drafts are derived in selectors, never stored.
export function initialState() {
  return {
    role: 'customer',
    shipments: { byId: SHIPMENTS_BY_ID, allIds: SHIPMENTS.map((s) => s.id) },
    notices: SEED_NOTICES,
    dismissedNoticeIds: [],
    activity: SEED_ACTIVITY,
    toasts: [],
    liveEventApplied: false,
    liveEventId: null,
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
      return record(next, {
        type: 'document',
        shipmentId: shipment.id,
        text: `${label} sent to ${name} by email`,
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

    case 'applyLiveEvent': {
      if (state.liveEventApplied) return state
      const { shipmentId, ...fields } = LIVE_EVENT
      const shipment = state.shipments.byId[shipmentId]
      const id = `${shipmentId}-e${shipment.events.length + 1}`
      const next = withShipment(state, shipmentId, (s) => ({ ...s, events: [...s.events, { id, ...fields }] }))
      const seq = next.seq
      return {
        ...next,
        seq: seq + 1,
        liveEventApplied: true,
        liveEventId: id,
        toasts: [
          ...next.toasts,
          {
            id: `toast-${seq}`,
            shipmentId,
            text: `New event on order ${shipmentId}: ${fields.raw.toLowerCase()} at ${fields.location}`,
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

    // Back to the seed. The role stays, so the presenter keeps their place.
    case 'resetDemo':
      return { ...initialState(), role: state.role }

    default:
      return state
  }
}
