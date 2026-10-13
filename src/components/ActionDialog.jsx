import { useRef, useState } from 'react'
import { draftDocumentRequest, draftDocumentSend, draftNotice, draftOperatorMessage } from '../ai/drafts.js'
import { DOCUMENT_LABELS, docLabel, documentFileName, isShipperDocument } from '../data/documents.js'
import { OPERATORS_BY_ID } from '../data/operators.js'
import { documentRecipient } from '../lib/documents.js'
import { fmtDateTime } from '../lib/format.js'
import { contactTarget } from '../lib/shipment.js'
import { contactOperator, requestDocument, sendDocument, sendNotice } from '../store/actions.js'
import { useDispatch } from '../store/useStore.js'
import AiStamp, { Why } from './AiStamp.jsx'
import './ActionDialog.css'

const route = (view) => `${view.origin.city} to ${view.destination.city}`

// Every draft fits with room to edit; the counter shows how much is left.
const MAX_TEXT = 600

// Where a message goes: operators by email, the customer through their Convoy
// inbox with an email copy. The dialog shows this line so the channel is
// never implicit.
const toOperator = (operator) => ({ name: operator.name, address: operator.email, channel: 'email' })
const toCustomer = (view) => ({ name: view.customerName, address: null, channel: 'Convoy inbox and email' })

// "not sent" for our own missing documents, "rejected 12 Oct, 16:40" otherwise.
function documentState(doc) {
  if (doc.status === 'rejected') return `rejected ${fmtDateTime(doc.rejectedAt)}`
  return doc.status === 'missing' && isShipperDocument(doc.type) ? 'not sent' : doc.status
}

// Each proposed action type from the risk engine maps to one dialog: its
// title, the draft, the facts the draft used, who receives it and the
// confirm button.
const ACTIONS = {
  notify: {
    title: (view) => `Draft notice to customer, order ${view.id}`,
    confirm: 'Send notice to customer',
    draft: (view) => draftNotice(view),
    facts(view) {
      const est = view.estimate
      const cause = view.risk.reasons[0]?.text
      return [
        `Order ${view.id}, ${route(view)}`,
        est ? `${est.moved ? 'Estimate' : 'Plan'} ${fmtDateTime(est.value)}, ${est.confidence} confidence` : null,
        cause ? `Cause: ${cause}` : null,
      ]
    },
    why: 'Built from the order, route, estimate and confidence, cause, and the next update time. Nothing is sent until you confirm.',
    to: (view) => toCustomer(view),
    send: (view, _action, text) => sendNotice({ shipmentId: view.id, kind: 'delay', text }),
  },
  send_document: {
    title: (view, action) => `Send ${docLabel(action.docType)}, order ${view.id}`,
    confirm: 'Send document',
    draft: (view, action) => draftDocumentSend(view, action.docType),
    facts(view, action) {
      const doc = view.documents.find((d) => d.type === action.docType)
      return [
        `Order ${view.id}, ${route(view)}`,
        `${DOCUMENT_LABELS[action.docType]}: ${documentState(doc)}`,
        doc.neededBy ? `Needed before ${doc.neededBy}` : null,
        `Attachment: ${documentFileName(action.docType, view.id)}, from the ERP`,
      ]
    },
    why: 'Built from the document status, who needs it next on the route, and the file the ERP holds for this order. Nothing is sent until you confirm.',
    to: (view, action) => toOperator(documentRecipient(view, action.docType)),
    send: (view, action, text) =>
      sendDocument({
        shipmentId: view.id,
        docType: action.docType,
        operatorId: documentRecipient(view, action.docType).id,
        text,
      }),
  },
  request_document: {
    title: (view, action) => `Request ${docLabel(action.docType)}, order ${view.id}`,
    confirm: 'Request document',
    draft: (view, action) => draftDocumentRequest(view, action.docType),
    facts(view, action) {
      const doc = view.documents.find((d) => d.type === action.docType)
      return [
        `Order ${view.id}, ${route(view)}`,
        `${DOCUMENT_LABELS[action.docType]}: ${documentState(doc)}`,
        doc.neededBy ? `Needed before ${doc.neededBy}` : null,
      ]
    },
    why: 'Built from the document status, who issues it, and what it is needed for. Nothing is sent until you confirm.',
    to: (view, action) => toOperator(documentRecipient(view, action.docType)),
    send: (view, action, text) =>
      requestDocument({
        shipmentId: view.id,
        docType: action.docType,
        operatorId: documentRecipient(view, action.docType).id,
        text,
      }),
  },
  contact_operator: {
    title: (view) => `Message operator, order ${view.id}`,
    confirm: 'Send message to operator',
    draft: (view) => draftOperatorMessage(view),
    facts(view) {
      const { operatorName, event } = contactTarget(view)
      return [
        `Order ${view.id}, ${route(view)}`,
        `${operatorName}, last status '${event.raw}' at ${event.location}, ${fmtDateTime(event.at)}`,
      ]
    },
    why: 'Built from the last status the operator sent. Nothing is sent until you confirm.',
    to: (view) => toOperator(OPERATORS_BY_ID[contactTarget(view).operatorId]),
    send: (view, _action, text) =>
      contactOperator({ shipmentId: view.id, operatorId: contactTarget(view).operatorId, text }),
  },
}

/*
  Draft, preview, confirm. Pass the shipment view and the proposed action
  ({ type: 'notify' | 'send_document' | 'request_document' | 'contact_operator',
  docType? }); mount it while the dialog should be open and unmount it in
  onClose. Nothing is dispatched until the confirm button is clicked, and what
  is sent is the edited text.
*/
export default function ActionDialog({ view, action, onClose }) {
  const dispatch = useDispatch()
  const spec = ACTIONS[action.type]
  const dialog = useRef(null)
  const [text, setText] = useState(() => spec.draft(view, action))
  const titleId = `action-title-${view.id}`
  const to = spec.to(view, action)

  // Callback ref: opens the modal once, even when StrictMode runs it twice.
  const open = (node) => {
    dialog.current = node
    if (node && !node.open) node.showModal()
  }

  // Closing through the dialog returns focus to the button that opened it.
  const close = () => dialog.current?.close()

  const confirm = () => {
    dispatch(spec.send(view, action, text.trim()))
    close()
  }

  return (
    <dialog
      className="action-dialog"
      ref={open}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div className="action-body">
        <div className="action-head">
          <h2 id={titleId}>{spec.title(view, action)}</h2>
          <AiStamp variant="drafted" />
        </div>

        <label className="visually-hidden" htmlFor={`${titleId}-text`}>
          Message text, editable
        </label>
        <div className="action-field">
          <textarea
            id={`${titleId}-text`}
            className="field action-text"
            rows={7}
            maxLength={MAX_TEXT}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <p className="action-count">
            <span className="visually-hidden">Length </span>
            {text.length} / {MAX_TEXT}
          </p>
        </div>

        <div className="action-facts">
          <p>Facts used</p>
          <ul>
            {spec.facts(view, action).filter(Boolean).map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </div>
        <Why>{spec.why}</Why>

        <dl className="action-to">
          <dt>To</dt>
          <dd>
            <span className="action-to-name">{to.name}</span>
            {to.address && <span className="action-to-part">{to.address}</span>}
            <span className="action-to-part">{to.channel}</span>
          </dd>
        </dl>

        <div className="action-buttons">
          <button type="button" className="button button-secondary" onClick={close}>
            Cancel
          </button>
          <button type="button" className="button" disabled={!text.trim()} onClick={confirm}>
            {spec.confirm}
          </button>
        </div>
      </div>
    </dialog>
  )
}
