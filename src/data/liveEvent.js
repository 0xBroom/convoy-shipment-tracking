import { NOW } from './now.js'

// The one scripted event the "Simulate new event" control applies, once.
export const LIVE_EVENT = {
  shipmentId: '12345',
  operatorId: 'portline',
  raw: 'Discharged',
  location: 'Oslo',
  legIndex: 1,
  at: NOW.toISOString(),
}
