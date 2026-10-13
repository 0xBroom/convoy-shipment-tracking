import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { LIVE_FEED } from '../data/liveFeed.js'
import { pauseFeed, playFeed, resetDemo } from '../store/actions.js'
import { useDispatch, useStore } from '../store/useStore.js'
import './DemoControls.css'

const TOTAL = LIVE_FEED.length

// What the feed button says and does in each state. The feed never starts by
// itself; the presenter plays, pauses and resumes it from here.
function feedControl(feed) {
  if (feed.cursor >= TOTAL) return { label: 'Live feed finished', action: null }
  if (feed.playing) return { label: 'Pause live feed', action: pauseFeed() }
  return { label: feed.cursor === 0 ? 'Start live feed' : 'Resume live feed', action: playFeed() }
}

// The presenter's controls, available in both roles and kept visually quiet.
// A disclosure with buttons, not an ARIA menu, so Tab and Enter behave the
// way people expect. While the feed plays, a pulsing dot sits on the trigger
// too, so the room can see the feed is live without opening the panel.
export default function DemoControls() {
  const { state } = useStore()
  const dispatch = useDispatch()
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const trigger = useRef(null)
  const { feed } = state
  const control = feedControl(feed)

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

  const progress =
    feed.cursor === 0 ? `${TOTAL} events, one every 4 s` : `Event ${Math.min(feed.cursor, TOTAL)} of ${TOTAL}`

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
        {feed.playing && (
          <span className="demo-live" aria-hidden="true">
            <span className="demo-live-dot" />
          </span>
        )}
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className="demo-panel" id="demo-panel">
          <button
            type="button"
            className="demo-item demo-feed"
            disabled={control.action === null}
            onClick={() => run(control.action)}
          >
            {feed.playing && <span className="demo-live-dot" aria-hidden="true" />}
            {control.label}
          </button>
          <p className="demo-progress" aria-live="polite">
            {feed.playing && <span className="visually-hidden">Live feed playing. </span>}
            {progress}
          </p>
          <button type="button" className="demo-item" onClick={() => run(resetDemo())}>
            Reset demo data
          </button>
        </div>
      )}
    </div>
  )
}
