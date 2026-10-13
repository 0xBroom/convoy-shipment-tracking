import { FileText, Paperclip, RotateCcw, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { draftDocumentRequest, draftDocumentSend, draftNotice, draftOperatorMessage, recipientLanguage } from '../ai/drafts.js'
import { DOCUMENT_LABELS, docLabel, documentFileName, isShipperDocument } from '../data/documents.js'
import { LANGUAGES, otherLanguage } from '../data/languages.js'
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

// How long the confirm button reads "Sending…" before the action lands.
// Long enough to be seen, short enough not to be waited for.
const SENDING_MS = 500

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

// The file the ERP holds for a shipper document, and the extra files a person
// can attach next to it. Nothing is read from disk: this prototype only names
// files, so the sizes are fixed and the extras come from a short list.
const ERP_FILE_SIZES = { invoice: '184 KB', packing_list: '121 KB', union_status: '77 KB' }
const erpFile = (docType, shipmentId) => ({
  name: documentFileName(docType, shipmentId),
  size: ERP_FILE_SIZES[docType] ?? '96 KB',
  source: 'from the ERP',
})
const EXTRA_FILES = [
  { stem: 'cover-letter', size: '42 KB' },
  { stem: 'certificate-of-origin', size: '96 KB' },
  { stem: 'delivery-instructions', size: '18 KB' },
]
const extraFile = ({ stem, size }, shipmentId) => ({ name: `${stem}-${shipmentId}.pdf`, size, removable: true })

function Attachments({ files, canAdd, onAdd, onRemove }) {
  return (
    <div className="action-attachments">
      <p>Attachment</p>
      <ul className="action-files">
        {files.map((file) => (
          <li key={file.name} className="action-file">
            <FileText size={16} aria-hidden="true" />
            <span className="action-file-name">{file.name}</span>
            <span className="action-file-part">{file.size}</span>
            {file.source && <span className="action-file-part">{file.source}</span>}
            {file.removable && (
              <button type="button" className="action-file-remove" aria-label={`Remove ${file.name}`} onClick={() => onRemove(file.name)}>
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <button type="button" className="button button-quiet action-attach" disabled={!canAdd} onClick={onAdd}>
        <Paperclip size={14} aria-hidden="true" />
        Attach another file
      </button>
      <p className="action-attach-note">Convoy attached the file on record in the ERP.</p>
    </div>
  )
}

// Each proposed action type from the risk engine maps to one dialog: its
// title, the draft (in a given language), the facts the draft used, who
// receives it and the confirm button.
const ACTIONS = {
  notify: {
    title: (view) => `Draft notice to customer, order ${view.id}`,
    confirm: 'Send notice to customer',
    draft: (view, _action, language) => draftNotice(view, { language }),
    facts(view) {
      const est = view.estimate
      const cause = view.risk.reasons[0]?.text
      const arrival = !est
        ? null
        : est.confirmed
          ? `Operator ETA ${fmtDateTime(est.value)}, posted by ${est.operatorName}`
          : `${est.moved ? 'Estimate' : 'Plan'} ${fmtDateTime(est.value)}, ${est.confidence} confidence`
      return [`Order ${view.id}, ${route(view)}`, arrival, cause ? `Cause: ${cause}` : null]
    },
    why: 'Built from the order, route, estimate and confidence, cause, and the next update time. Nothing is sent until you confirm.',
    to: (view) => toCustomer(view),
    send: (view, _action, text) => sendNotice({ shipmentId: view.id, kind: 'delay', text }),
  },
  send_document: {
    title: (view, action) => `Send ${docLabel(action.docType)}, order ${view.id}`,
    confirm: 'Send document',
    draft: (view, action, language) => draftDocumentSend(view, action.docType, { language }),
    facts(view, action) {
      const doc = view.documents.find((d) => d.type === action.docType)
      return [
        `Order ${view.id}, ${route(view)}`,
        `${DOCUMENT_LABELS[action.docType]}: ${documentState(doc)}`,
        doc.neededBy ? `Needed before ${doc.neededBy}` : null,
      ]
    },
    why: 'Built from the document status, who needs it next on the route, and the file the ERP holds for this order. Nothing is sent until you confirm.',
    to: (view, action) => toOperator(documentRecipient(view, action.docType)),
    attachments: true,
    send: (view, action, text, attachments) =>
      sendDocument({
        shipmentId: view.id,
        docType: action.docType,
        operatorId: documentRecipient(view, action.docType).id,
        text,
        attachments,
      }),
  },
  request_document: {
    title: (view, action) => `Request ${docLabel(action.docType)}, order ${view.id}`,
    confirm: 'Request document',
    draft: (view, action, language) => draftDocumentRequest(view, action.docType, { language }),
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
    draft: (view, _action, language) => draftOperatorMessage(view, { language }),
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
  onClose. Nothing is dispatched until the confirm button is clicked and the
  short "Sending…" state has passed, and what is sent is the edited text.
  Cancel during that state drops the send.

  The draft is written in the recipient's language. "Write in … instead"
  switches it and regenerates the draft; the sent text keeps whichever
  language it was written in.
*/
export default function ActionDialog({ view, action, onClose }) {
  const dispatch = useDispatch()
  const spec = ACTIONS[action.type]
  const dialog = useRef(null)
  const [recipient] = useState(() => recipientLanguage(view, action))
  const [language, setLanguage] = useState(recipient.language)
  const [draft, setDraft] = useState(() => spec.draft(view, action, language))
  const [text, setText] = useState(draft)
  const [extras, setExtras] = useState([])
  const [sending, setSending] = useState(false)
  const sendTimer = useRef(null)
  const titleId = `action-title-${view.id}`
  const to = spec.to(view, action)
  const edited = text !== draft
  const chosen = language !== recipient.language
  const languageWhy = chosen
    ? `Written in ${LANGUAGES[language]} at your request; ${recipient.reason}.`
    : `Written in ${LANGUAGES[language]} because ${recipient.reason}.`

  useEffect(() => () => clearTimeout(sendTimer.current), [])

  // A new language means a new draft; any edits to the old one are dropped.
  const switchLanguage = () => {
    const next = otherLanguage(language)
    const regenerated = spec.draft(view, action, next)
    setLanguage(next)
    setDraft(regenerated)
    setText(regenerated)
  }

  // The ERP file always goes; extras are added and removed by name.
  const files = spec.attachments ? [erpFile(action.docType, view.id), ...extras] : []
  const nextExtra = EXTRA_FILES.find((candidate) => !extras.some((file) => file.name === extraFile(candidate, view.id).name))
  const addExtra = () => setExtras((current) => [...current, extraFile(nextExtra, view.id)])
  const removeExtra = (name) => setExtras((current) => current.filter((file) => file.name !== name))

  // Callback ref: opens the modal once, even when StrictMode runs it twice.
  const open = (node) => {
    dialog.current = node
    if (node && !node.open) node.showModal()
  }

  // Closing through the dialog returns focus to the button that opened it.
  // Any close (Cancel, Escape, backdrop) also drops a send still pending.
  const close = () => dialog.current?.close()
  const closed = () => {
    clearTimeout(sendTimer.current)
    onClose()
  }

  const confirm = () => {
    setSending(true)
    sendTimer.current = setTimeout(() => {
      dispatch(spec.send(view, action, text.trim(), files.map((file) => file.name)))
      close()
    }, SENDING_MS)
  }

  return (
    <dialog
      className="action-dialog"
      ref={open}
      aria-labelledby={titleId}
      onClose={closed}
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
            readOnly={sending}
            onChange={(event) => setText(event.target.value)}
          />
          <div className="action-field-foot">
            {edited && !sending && (
              <button type="button" className="button button-quiet action-regenerate" onClick={() => setText(draft)}>
                <RotateCcw size={14} aria-hidden="true" />
                Regenerate from facts
              </button>
            )}
            <p className="action-count">
              <span className="visually-hidden">Length </span>
              {text.length} / {MAX_TEXT}
            </p>
          </div>
        </div>

        {spec.attachments && <Attachments files={files} canAdd={Boolean(nextExtra)} onAdd={addExtra} onRemove={removeExtra} />}

        <div className="action-facts">
          <p>Facts used</p>
          <ul>
            {spec.facts(view, action).filter(Boolean).map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </div>
        <Why>
          {spec.why} {languageWhy}
        </Why>

        <dl className="action-to">
          <div>
            <dt>To</dt>
            <dd>
              <span className="action-to-name">{to.name}</span>
              {to.address && <span className="action-to-part">{to.address}</span>}
              <span className="action-to-part">{to.channel}</span>
            </dd>
          </div>
          <div>
            <dt>Language</dt>
            <dd>
              <span className="action-to-name">{LANGUAGES[language]}</span>
              <span className="action-to-part">
                {chosen ? 'your choice; ' : ''}
                {recipient.reason}
              </span>
              <button type="button" className="link-button action-language" disabled={sending} onClick={switchLanguage}>
                Write in {LANGUAGES[otherLanguage(language)]} instead
              </button>
            </dd>
          </div>
        </dl>

        <div className="action-buttons">
          <button type="button" className="button button-secondary" onClick={close}>
            Cancel
          </button>
          <button type="button" className="button" disabled={!text.trim() || sending} onClick={confirm}>
            {sending ? 'Sending…' : spec.confirm}
          </button>
        </div>
      </div>
    </dialog>
  )
}
