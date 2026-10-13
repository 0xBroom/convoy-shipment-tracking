import { createContext, useContext, useState } from 'react'

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

// The id of the latest live event, but only when it arrived while the calling
// screen was mounted. A screen opened after the event shows it as plain
// history, so the one orchestrated motion plays once, where the person is
// looking.
export function useLiveEventId() {
  const liveEventId = useStore().state.live.eventId
  const [atMount] = useState(liveEventId)
  return liveEventId !== null && liveEventId !== atMount ? liveEventId : null
}

// The shipment the latest live event touched: lists tint its row while it is
// the last thing that changed.
export const useLiveShipmentId = () => useStore().state.live.shipmentId
