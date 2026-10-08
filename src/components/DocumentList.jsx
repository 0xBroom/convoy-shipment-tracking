import { Check, CircleAlert, Clock, X } from 'lucide-react'
import { DOCUMENT_LABELS } from '../data/documents.js'
import { fmtDateTime } from '../lib/format.js'
import './DocumentList.css'

const STATUS = {
  ok: { label: 'OK', Icon: Check },
  missing: { label: 'Missing', Icon: CircleAlert },
  rejected: { label: 'Rejected', Icon: X },
  requested: { label: 'Requested', Icon: Clock },
}

function noteOf(doc) {
  switch (doc.status) {
    case 'requested':
      return `Requested on ${fmtDateTime(doc.requestedAt)}. Convoy asked for it.`
    case 'rejected':
      return `Rejected ${fmtDateTime(doc.rejectedAt)}. A corrected version is needed${doc.neededBy ? ` before ${doc.neededBy}` : ''}.`
    case 'missing':
      return doc.neededBy ? `Needed before ${doc.neededBy}.` : 'Needed for this shipment.'
    default:
      return null
  }
}

// The four document types with an icon and a word each. `renderAction`, when
// given, adds a slot per row (ops uses it for "Request document").
export default function DocumentList({ documents, renderAction = null }) {
  return (
    <ul className="docs">
      {documents.map((doc) => {
        const { label, Icon } = STATUS[doc.status]
        return (
          <li className="docs-row" key={doc.type} data-status={doc.status}>
            <span className="docs-name">{DOCUMENT_LABELS[doc.type]}</span>
            <span className="docs-status">
              <Icon size={16} aria-hidden="true" />
              {label}
            </span>
            <span className="docs-note">{noteOf(doc)}</span>
            {renderAction && <span className="docs-action">{renderAction(doc)}</span>}
          </li>
        )
      })}
    </ul>
  )
}
