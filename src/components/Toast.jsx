import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { dismissToast } from '../store/actions.js'
import { useDispatch, useStore } from '../store/useStore.js'
import './Toast.css'

const VISIBLE_MS = 5000

// A toast carries `text`, an optional `detail` line under it (what the event
// means), an optional `tone` ('neutral' | 'warning' | 'success') for the rule
// on its left, and the shipment it is about.
function ToastItem({ toast, role }) {
  const dispatch = useDispatch()
  const { pathname } = useLocation()
  const [held, setHeld] = useState(false)

  // Auto-dismiss waits while the pointer is over the toast or focus is inside
  // it, so the link can be reached by keyboard. Leaving restarts the 5 s.
  useEffect(() => {
    if (held) return undefined
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [toast.id, held, dispatch])

  // The link goes to the order's detail for the current role, and is left out
  // when that page is already open.
  const to = toast.shipmentId ? `/${role}/shipments/${toast.shipmentId}` : null
  const showLink = to !== null && to !== pathname

  return (
    <div
      className="toast"
      data-tone={toast.tone ?? 'neutral'}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false)
      }}
    >
      <div className="toast-body">
        <p>{toast.text}</p>
        {toast.detail && <p className="toast-detail">{toast.detail}</p>}
        {showLink && <Link to={to}>Open order {toast.shipmentId}</Link>}
      </div>
      <button type="button" className="toast-close" onClick={() => dispatch(dismissToast(toast.id))}>
        <X size={16} aria-hidden="true" />
        <span className="visually-hidden">Dismiss</span>
      </button>
    </div>
  )
}

// Always mounted so assistive technology already watches the live region when
// the first message arrives. Polite, never steals focus.
export default function Toasts() {
  const { state } = useStore()
  return (
    <div className="toast-region" aria-live="polite" role="status">
      {state.toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} role={state.role} />
      ))}
    </div>
  )
}
