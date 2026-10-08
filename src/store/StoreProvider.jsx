import { useMemo, useReducer } from 'react'
import { initialState, reducer } from './reducer.js'
import { StoreContext } from './useStore.js'

export default function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext value={value}>{children}</StoreContext>
}
