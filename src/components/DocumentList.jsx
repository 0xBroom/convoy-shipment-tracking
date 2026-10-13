import { Check, CircleAlert, Clock, Send, X } from 'lucide-react'
import { DOCUMENT_LABELS, isShipperDocument } from '../data/documents.js'
import { OPERATORS_BY_ID } from '../data/operators.js'
import { fmtDateTime } from '../lib/format.js'
import './DocumentList.css'

const STATUS = {
  ok: { label: 'OK', Icon: Check },
  missing: { label: 'Missing', Icon: CircleAlert },
  rejected: { label: 'Rejected', Icon: X },
  requested: { label: 'Requested', Icon: Clock },
  sent: { label: 'Sent', Icon: Send },
}

// Our own documents are never "missing" from someone else: they are not sent yet.
const labelOf = (doc) =>
  doc.status === 'missing' && isShipperDocument(doc.type) ? 'Not sent' : STATUS[doc.status].label

const operatorName = (id) => OPERATORS_BY_ID[id]?.name ?? 'the operator'

function noteOf(doc) {
  switch (doc.status) {
    case 'sent':
      return `Sent to ${operatorName(doc.sentTo)} on ${fmtDateTime(doc.sentAt)} by email.`
    case 'requested':
      return `Requested from ${operatorName(doc.requestedFrom)} on ${fmtDateTime(doc.requestedAt)} by email.`
    case 'rejected':
      return `Rejected ${fmtDateTime(doc.rejectedAt)}. A corrected version is needed${doc.neededBy ? ` before ${doc.neededBy}` : ''}.`
    case 'missing':
      return doc.neededBy ? `Needed before ${doc.neededBy}.` : 'Needed for this shipment.'
    default:
      return null
  }
}

// The four document types with an icon and a word each. `renderAction`, when
// given, adds a slot per row (ops uses it for "Send document" and "Request
// document").
export default function DocumentList({ documents, renderAction = null }) {
  return (
    <ul className="docs">
      {documents.map((doc) => {
        const { Icon } = STATUS[doc.status]
        return (
          <li className="docs-row" key={doc.type} data-status={doc.status}>
            <span className="docs-name">{DOCUMENT_LABELS[doc.type]}</span>
            <span className="docs-status">
              <Icon size={16} aria-hidden="true" />
              {labelOf(doc)}
            </span>
            <span className="docs-note">{noteOf(doc)}</span>
            {renderAction && <span className="docs-action">{renderAction(doc)}</span>}
          </li>
        )
      })}
    </ul>
  )
}
