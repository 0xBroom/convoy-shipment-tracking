import { X } from 'lucide-react'
import { useEffect } from 'react'
import { dismissToast } from '../store/actions.js'
import { useDispatch, useStore } from '../store/useStore.js'
import './Toast.css'

const VISIBLE_MS = 5000

function ToastItem({ toast }) {
  const dispatch = useDispatch()
  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [toast.id, dispatch])

  return (
    <div className="toast">
      <p>{toast.text}</p>
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
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
