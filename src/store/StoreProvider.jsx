import { useMemo, useReducer } from 'react'
import { useFeedTicker } from './liveFeed.js'
import { initialState, reducer } from './reducer.js'
import { StoreContext } from './useStore.js'

export default function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  useFeedTicker(state.feed.playing, dispatch)
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext value={value}>{children}</StoreContext>
}
