import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { applyLiveEvent, resetDemo } from '../store/actions.js'
import { useDispatch, useStore } from '../store/useStore.js'
import './DemoControls.css'

// The presenter's controls, available in both roles and kept visually quiet.
// A disclosure with two buttons, not an ARIA menu, so Tab and Enter behave
// the way people expect.
export default function DemoControls() {
  const { state } = useStore()
  const dispatch = useDispatch()
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const trigger = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const run = (action) => {
    dispatch(action)
    setOpen(false)
  }

  return (
    <div className="demo" ref={root}>
      <button
        type="button"
        className="demo-trigger"
        ref={trigger}
        aria-expanded={open}
        aria-controls="demo-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        <span className="demo-trigger-label">Demo controls</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className="demo-panel" id="demo-panel">
          <button
            type="button"
            className="demo-item"
            disabled={state.liveEventApplied}
            onClick={() => run(applyLiveEvent())}
          >
            {state.liveEventApplied ? 'Event received' : 'Simulate new event'}
          </button>
          <button type="button" className="demo-item" onClick={() => run(resetDemo())}>
            Reset demo data
          </button>
        </div>
      )}
    </div>
  )
}
