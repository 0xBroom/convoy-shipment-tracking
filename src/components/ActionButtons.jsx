import { useState } from 'react'
import { docLabel } from '../data/documents.js'
import { actionsOf } from '../lib/actions.js'
import { selectActivity } from '../store/selectors.js'
import { useSelector } from '../store/useStore.js'
import ActionDialog from './ActionDialog.jsx'
import './ActionButtons.css'

// One name per action, the same in the button, the dialog confirm and the toast.
const LABELS = {
  notify: 'Draft notice to customer',
  request_document: 'Request document',
  contact_operator: 'Contact operator',
}

// One button that opens the draft-and-confirm dialog for one proposed action
// ({ type, docType? }). Mounts the dialog only while it is open.
export function ActionButton({ view, action, variant = 'secondary' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className={`button${variant === 'primary' ? '' : ` button-${variant}`}`}
        onClick={() => setOpen(true)}
      >
        {LABELS[action.type]}
        {action.docType && <span className="visually-hidden">, {docLabel(action.docType)}</span>}
      </button>
      {open && <ActionDialog view={view} action={action} onClose={() => setOpen(false)} />}
    </>
  )
}

// The action Convoy proposes: the first one still worth taking. A notice that
// was already sent is not proposed again, and "awaiting" is a wait, not a task.
function proposedOf(view) {
  const open = view.risk.actions.find((a) => !(a.type === 'notify' && view.notified))
  return open && open.type !== 'awaiting_operator' ? open : null
}

const sameAction = (a, b) => a && a.type === b.type && (a.docType ?? null) === (b.docType ?? null)

// With `emphasis`, only the proposed action is filled and the rest are quiet,
// so a dense row has one primary button that agrees with its proposed-action text.
export default function ActionButtons({ view, notice = true, emphasis = false }) {
  const proposed = emphasis ? proposedOf(view) : null
  return (
    <div className="action-buttons-row">
      {actionsOf(view, { notice })
        .map((action) => ({ action, primary: emphasis && sameAction(proposed, action) }))
        .sort((a, b) => Number(b.primary) - Number(a.primary))
        .map(({ action, primary }) => {
          const variant = !emphasis ? 'secondary' : primary ? 'primary' : 'quiet'
          return <ActionButton key={`${action.type}-${action.docType ?? ''}`} view={view} action={action} variant={variant} />
        })}
    </div>
  )
}

// What ops already did on this shipment, as short state text.
export function ActionStates({ view }) {
  const log = useSelector((state) => selectActivity(state, view.id))
  const message = log.find((entry) => entry.type === 'operator')
  const states = [
    view.notified && 'Customer notified',
    view.documents.some((d) => d.status === 'requested') && 'Document requested',
    message && message.text,
  ].filter(Boolean)
  if (states.length === 0) return null
  return (
    <ul className="action-states">
      {states.map((text) => (
        <li key={text}>{text}</li>
      ))}
    </ul>
  )
}
