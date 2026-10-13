import { NOW } from './now.js'
import { t } from './time.js'

/*
  The scripted live feed: seven operator events the presenter plays from
  "Demo controls", one every four seconds. Event k is stamped NOW + k × 4 s on
  the demo clock, never on the real one, so the "Last updated" time and every
  derivation stay identical on any machine.

  The arc moves every number on Today at least once: the hero order leaves the
  vessel, is stopped by Norwegian customs and cleared again; a Gdansk hold is
  released; a stale feed wakes up; a carrier posts its own ETA and supersedes
  the Convoy estimate; one more order is delivered.

  `note` is the plain-language meaning shown under the raw status in the toast.
  `tone` picks the toast's rule colour. `operatorEta` is the optional arrival
  time an operator commits to with its status.
*/
export const LIVE_FEED_STEP_MS = 4_000

const at = (k) => new Date(NOW.getTime() + k * LIVE_FEED_STEP_MS).toISOString()

export const LIVE_FEED = [
  {
    shipmentId: '12345',
    operatorId: 'portline',
    raw: 'Discharged',
    location: 'Oslo',
    legIndex: 1,
    at: at(1),
    tone: 'neutral',
    note: 'Order 12345 is off the vessel; only import customs remains.',
  },
  {
    shipmentId: '12439',
    operatorId: 'baltic-customs',
    raw: 'Released',
    location: 'Gdansk',
    legIndex: 2,
    at: at(2),
    tone: 'success',
    note: 'Order 12439 is released; the hold at Gdansk is lifted.',
  },
  {
    shipmentId: '12377',
    operatorId: 'iberroute',
    raw: 'In transit',
    location: 'Lyon',
    legIndex: 0,
    at: at(3),
    tone: 'neutral',
    note: 'Order 12377 is moving again; its feed is no longer stale.',
  },
  {
    shipmentId: '12345',
    operatorId: 'fjordklar',
    raw: 'Stoppet for kontroll',
    location: 'Oslo',
    legIndex: 2,
    at: at(4),
    tone: 'warning',
    note: 'Order 12345 is held for inspection at Oslo.',
  },
  {
    shipmentId: '12466',
    operatorId: 'nordhaul',
    raw: 'Linehaul',
    location: 'Montpellier',
    legIndex: 0,
    at: at(5),
    operatorEta: t(15, '14:00'),
    tone: 'neutral',
    note: 'Nordhaul commits to 15 Oct, 14:00 for order 12466; the Convoy estimate is superseded.',
  },
  {
    shipmentId: '12420',
    operatorId: 'iberroute',
    raw: 'POD',
    location: 'Madrid',
    legIndex: 0,
    at: at(6),
    tone: 'success',
    note: 'Order 12420 is delivered in Madrid.',
  },
  {
    shipmentId: '12345',
    operatorId: 'fjordklar',
    raw: 'Fortollet',
    location: 'Oslo',
    legIndex: 2,
    at: at(7),
    tone: 'success',
    note: 'Order 12345 is cleared; the estimate is recomputed.',
  },
]
