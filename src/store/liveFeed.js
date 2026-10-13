import { useEffect } from 'react'
import { LIVE_FEED_STEP_MS } from '../data/liveFeed.js'
import { applyFeedEvent } from './actions.js'

// The only timer in the app. It lives next to the store, above the router, so
// a route change never restarts or loses it; it runs only while the feed is
// playing, and the reducer stops the feed after the last scripted event.
// Pausing clears it, resuming starts a fresh four-second wait.
export function useFeedTicker(playing, dispatch) {
  useEffect(() => {
    if (!playing) return undefined
    const timer = setInterval(() => dispatch(applyFeedEvent()), LIVE_FEED_STEP_MS)
    return () => clearInterval(timer)
  }, [playing, dispatch])
}
