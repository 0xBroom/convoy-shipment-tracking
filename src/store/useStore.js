import { createContext, useContext } from 'react'

// The context object lives here, not in StoreProvider.jsx, so that file can
// export only a component (react-refresh/only-export-components).
export const StoreContext = createContext(null)

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore needs a StoreProvider above it.')
  return store
}

export const useDispatch = () => useStore().dispatch

// Selectors are pure functions of state, so they run on every render. The
// perimeter and view caches in selectors.js keep that cheap.
export function useSelector(select) {
  return select(useStore().state)
}
