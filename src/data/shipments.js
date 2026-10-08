import { SITES_BY_ID } from './sites.js'
import { t } from './time.js'
import { DOCUMENT_TYPES } from './documents.js'

/*
  Shipments are facts only: what the order promised (plan), what operators
  reported (events) and which documents exist. There is no status, risk or ETA
  field here; those are derived by src/ai and src/lib/status.js, so they stay
  correct after every action.

  Conventions
  - Dates are ISO strings with an explicit Madrid offset (all dates fall before
    the clocks change on 25 Oct), written through t(day, "HH:MM") from time.js.
  - An event with `delayHours` reports a delay the operator confirmed
    (for example a vessel rollover); the ETA engine adds it to the plan.
  - Customs legs carry `typicalHours` ([low, high]), the usual clearance time.
    The plan window of the leg is what the order assumed.
  - Raw statuses are exactly what each operator sends. 'ROLLED' is not in the
    Portline vocabulary on purpose: it must render as "Not mapped".
*/

const site = (id) => {
  const { city, country, name } = SITES_BY_ID[id]
  return { siteId: id, city, country, label: name }
}
const place = (city, country) => ({ siteId: null, city, country, label: city })

const leg = (mode, operatorId, from, to, kinds, [plannedDeparture, plannedArrival], extra) => ({
  mode,
  operatorId,
  from,
  to,
  fromKind: kinds[0],
  toKind: kinds[1],
  plannedDeparture,
  plannedArrival,
  ...extra,
})

const event = (operatorId, raw, location, legIndex, at, extra) => ({
  operatorId,
  raw,
  location,
  legIndex,
  at,
  ...extra,
})

const documents = (overrides = {}) =>
  DOCUMENT_TYPES.map((type) => ({ type, status: 'ok', ...overrides[type] }))

// Events are stored in time order with stable ids ("12345-e3").
function shipment({ id, events, ...rest }) {
  const ordered = [...events].sort((a, b) => a.at.localeCompare(b.at))
  return {
    id,
    documents: documents(),
    flags: {},
    ...rest,
    events: ordered.map((e, i) => ({ id: `${id}-e${i + 1}`, ...e })),
  }
}

// One road leg from origin to destination, events as [raw, location, at, extra].
function roadShipment({ operatorId, origin, destination, departure, promisedAt, rows, ...rest }) {
  return shipment({
    origin,
    destination,
    promisedAt,
    legs: [
      leg('road', operatorId, origin.label, destination.label, ['site', 'site'], [departure, promisedAt]),
    ],
    events: rows.map(([raw, location, at, extra]) => event(operatorId, raw, location, 0, at, extra)),
    ...rest,
  })
}

export const SHIPMENTS = [
  // Hero: four legs, four operators, one rolled vessel, one missing invoice.
  shipment({
    id: '12345',
    customerId: 'nordvik',
    origin: site('zaragoza'),
    destination: site('gdansk'),
    promisedAt: t(12, '12:00'),
    legs: [
      leg('road', 'iberroute', 'Zaragoza plant', 'Tarragona port', ['site', 'port'], [t(6, '07:00'), t(6, '20:00')]),
      leg('sea', 'portline', 'Tarragona port', 'Gdansk port', ['port', 'port'], [t(7, '20:00'), t(11, '06:00')]),
      leg('customs', 'baltic-customs', 'Gdansk', 'Gdansk', ['customs', 'customs'], [t(11, '08:00'), t(11, '22:00')], {
        typicalHours: [24, 48],
      }),
      leg('road', 'nordhaul', 'Gdansk port', 'Nordvik, Gdansk', ['port', 'site'], [t(12, '06:00'), t(12, '12:00')]),
    ],
    events: [
      event('iberroute', 'Tendered', 'Zaragoza', 0, t(6, '07:40')),
      event('iberroute', 'Depot scan', 'Zaragoza', 0, t(6, '09:10')),
      event('iberroute', 'OUT_FOR_DELIVERY', 'Tarragona', 0, t(6, '18:05')),
      event('iberroute', 'POD', 'Tarragona', 0, t(6, '19:30')),
      event('portline', 'Gate-in', 'Tarragona', 1, t(6, '21:30')),
      event('portline', 'Loaded on vessel', 'Tarragona', 1, t(7, '15:00')),
      event('baltic-customs', 'Docs lodged', 'Gdansk', 2, t(8, '10:00')),
      event('portline', 'ROLLED', 'Tarragona', 1, t(8, '13:10'), { delayHours: 18 }),
    ],
    documents: documents({
      invoice: { status: 'missing', neededBy: 'customs review at Gdansk' },
    }),
    flags: { incidentId: 'tarragona-rollover' },
  }),

  // Held at customs with a rejected declaration, also hit by the rollover.
  shipment({
    id: '12290',
    customerId: 'nordvik',
    origin: site('tarragona'),
    destination: site('gdansk'),
    promisedAt: t(11, '18:00'),
    legs: [
      leg('road', 'iberroute', 'Tarragona warehouse', 'Tarragona port', ['site', 'port'], [t(5, '08:00'), t(5, '18:00')]),
      leg('sea', 'portline', 'Tarragona port', 'Gdansk port', ['port', 'port'], [t(6, '18:00'), t(10, '06:00')]),
      leg('customs', 'baltic-customs', 'Gdansk', 'Gdansk', ['customs', 'customs'], [t(10, '08:00'), t(11, '08:00')], {
        typicalHours: [24, 48],
      }),
      leg('road', 'nordhaul', 'Gdansk port', 'Nordvik, Gdansk', ['port', 'site'], [t(11, '12:00'), t(11, '18:00')]),
    ],
    events: [
      event('iberroute', 'Tendered', 'Tarragona', 0, t(5, '08:15')),
      event('iberroute', 'Depot scan', 'Tarragona', 0, t(5, '10:00')),
      event('iberroute', 'OUT_FOR_DELIVERY', 'Tarragona', 0, t(5, '15:40')),
      event('iberroute', 'POD', 'Tarragona', 0, t(5, '17:20')),
      event('portline', 'Gate-in', 'Tarragona', 1, t(5, '19:00')),
      event('portline', 'Loaded on vessel', 'Tarragona', 1, t(6, '14:00')),
      event('baltic-customs', 'Docs lodged', 'Gdansk', 2, t(6, '11:00')),
      event('baltic-customs', 'Held for inspection', 'Gdansk', 2, t(7, '16:40')),
      event('portline', 'ROLLED', 'Tarragona', 1, t(8, '13:10'), { delayHours: 18 }),
    ],
    documents: documents({
      customs_declaration: {
        status: 'rejected',
        rejectedAt: t(7, '16:40'),
        neededBy: 'customs release at Gdansk',
      },
    }),
    flags: { incidentId: 'tarragona-rollover' },
  }),

  // Third shipment on the rolled vessel, for another customer.
  shipment({
    id: '12411',
    customerId: 'lusitania',
    origin: site('tarragona'),
    destination: site('gdansk'),
    promisedAt: t(12, '18:00'),
    legs: [
      leg('road', 'iberroute', 'Tarragona warehouse', 'Tarragona port', ['site', 'port'], [t(5, '09:00'), t(5, '19:00')]),
      leg('sea', 'portline', 'Tarragona port', 'Gdansk port', ['port', 'port'], [t(7, '20:00'), t(11, '08:00')]),
      leg('customs', 'baltic-customs', 'Gdansk', 'Gdansk', ['customs', 'customs'], [t(11, '10:00'), t(12, '10:00')], {
        typicalHours: [12, 24],
      }),
      leg('road', 'nordhaul', 'Gdansk port', 'Lusitania Parts, Gdansk', ['port', 'site'], [t(12, '12:00'), t(12, '18:00')]),
    ],
    events: [
      event('iberroute', 'Tendered', 'Tarragona', 0, t(5, '09:00')),
      event('iberroute', 'Depot scan', 'Tarragona', 0, t(5, '11:30')),
      event('iberroute', 'OUT_FOR_DELIVERY', 'Tarragona', 0, t(5, '17:10')),
      event('iberroute', 'POD', 'Tarragona', 0, t(5, '18:45')),
      event('portline', 'Gate-in', 'Tarragona', 1, t(5, '21:00')),
      event('portline', 'Loaded on vessel', 'Tarragona', 1, t(7, '11:00')),
      event('baltic-customs', 'Docs lodged', 'Gdansk', 2, t(8, '09:30')),
      event('portline', 'ROLLED', 'Tarragona', 1, t(8, '13:10'), { delayHours: 18 }),
    ],
    flags: { incidentId: 'tarragona-rollover' },
  }),

  // Held for inspection at Gdansk after arriving on schedule.
  shipment({
    id: '12439',
    customerId: 'vistula',
    origin: site('tarragona'),
    destination: site('gdansk'),
    promisedAt: t(9, '14:00'),
    legs: [
      leg('road', 'iberroute', 'Tarragona warehouse', 'Tarragona port', ['site', 'port'], [t(2, '08:00'), t(2, '16:00')]),
      leg('sea', 'medlines', 'Tarragona port', 'Gdansk port', ['port', 'port'], [t(3, '22:00'), t(7, '18:00')]),
      leg('customs', 'baltic-customs', 'Gdansk', 'Gdansk', ['customs', 'customs'], [t(7, '20:00'), t(8, '20:00')], {
        typicalHours: [24, 48],
      }),
      leg('road', 'nordhaul', 'Gdansk port', 'Vistula Components, Gdansk', ['port', 'site'], [t(9, '08:00'), t(9, '14:00')]),
    ],
    events: [
      event('iberroute', 'Tendered', 'Tarragona', 0, t(2, '08:00')),
      event('iberroute', 'Depot scan', 'Tarragona', 0, t(2, '10:00')),
      event('iberroute', 'OUT_FOR_DELIVERY', 'Tarragona', 0, t(2, '13:00')),
      event('iberroute', 'POD', 'Tarragona', 0, t(2, '14:30')),
      event('medlines', 'GATE IN', 'Tarragona', 1, t(2, '17:00')),
      event('medlines', 'VSL LOAD', 'Tarragona', 1, t(3, '10:00')),
      event('medlines', 'VSL DEP', 'Tarragona', 1, t(3, '22:00')),
      event('baltic-customs', 'Docs lodged', 'Gdansk', 2, t(4, '09:00')),
      event('medlines', 'VSL ARR', 'Gdansk', 1, t(7, '18:00')),
      event('medlines', 'DISCH', 'Gdansk', 1, t(7, '21:30')),
      event('baltic-customs', 'Under review', 'Gdansk', 2, t(7, '23:10')),
      event('baltic-customs', 'Held for inspection', 'Gdansk', 2, t(8, '08:40')),
    ],
  }),

  // Healthy multimodal shipment: vessel departed on time this morning.
  shipment({
    id: '12384',
    customerId: 'vistula',
    origin: site('tarragona'),
    destination: site('gdansk'),
    promisedAt: t(13, '14:00'),
    legs: [
      leg('road', 'iberroute', 'Tarragona warehouse', 'Tarragona port', ['site', 'port'], [t(6, '08:00'), t(6, '14:30')]),
      leg('sea', 'medlines', 'Tarragona port', 'Gdansk port', ['port', 'port'], [t(7, '22:00'), t(11, '10:00')]),
      leg('customs', 'baltic-customs', 'Gdansk', 'Gdansk', ['customs', 'customs'], [t(11, '12:00'), t(12, '12:00')], {
        typicalHours: [12, 24],
      }),
      leg('road', 'nordhaul', 'Gdansk port', 'Vistula Components, Gdansk', ['port', 'site'], [t(13, '08:00'), t(13, '14:00')]),
    ],
    events: [
      event('iberroute', 'Tendered', 'Tarragona', 0, t(6, '08:30')),
      event('iberroute', 'Depot scan', 'Tarragona', 0, t(6, '10:00')),
      event('iberroute', 'OUT_FOR_DELIVERY', 'Tarragona', 0, t(6, '12:40')),
      event('iberroute', 'POD', 'Tarragona', 0, t(6, '13:55')),
      event('medlines', 'GATE IN', 'Tarragona', 1, t(6, '16:00')),
      event('medlines', 'VSL LOAD', 'Tarragona', 1, t(7, '10:00')),
      event('medlines', 'VSL DEP', 'Tarragona', 1, t(7, '22:00')),
    ],
  }),

  // Delayed vessel to Marseille with a French broker (French raw statuses).
  shipment({
    id: '12471',
    customerId: 'rhone',
    origin: site('tarragona'),
    destination: place('Marseille', 'FR'),
    promisedAt: t(8, '18:00'),
    legs: [
      leg('road', 'iberroute', 'Tarragona warehouse', 'Tarragona port', ['site', 'port'], [t(4, '08:00'), t(4, '15:00')]),
      leg('sea', 'medlines', 'Tarragona port', 'Marseille port', ['port', 'port'], [t(5, '03:00'), t(6, '03:00')]),
      leg('customs', 'rhone-brokers', 'Marseille', 'Marseille', ['customs', 'customs'], [t(6, '06:00'), t(7, '06:00')], {
        typicalHours: [12, 24],
      }),
      leg('road', 'nordhaul', 'Marseille port', 'Rhone Industries, Marseille', ['port', 'site'], [t(8, '06:00'), t(8, '18:00')]),
    ],
    events: [
      event('iberroute', 'Tendered', 'Tarragona', 0, t(4, '08:00')),
      event('iberroute', 'Depot scan', 'Tarragona', 0, t(4, '10:00')),
      event('iberroute', 'OUT_FOR_DELIVERY', 'Tarragona', 0, t(4, '13:00')),
      event('iberroute', 'POD', 'Tarragona', 0, t(4, '14:20')),
      event('medlines', 'GATE IN', 'Tarragona', 1, t(4, '17:00')),
      event('rhone-brokers', 'Déclaration déposée', 'Marseille', 2, t(6, '09:00')),
      event('medlines', 'VSL LOAD', 'Tarragona', 1, t(7, '09:00')),
      event('medlines', 'VSL DEP', 'Tarragona', 1, t(8, '03:00'), { delayHours: 120 }),
    ],
  }),

  // Inbound from Gdansk, vessel just departed. No customs leg inside the EU.
  shipment({
    id: '12392',
    customerId: 'lusitania',
    origin: site('gdansk'),
    destination: site('zaragoza'),
    promisedAt: t(12, '18:00'),
    legs: [
      leg('road', 'nordhaul', 'Gdansk', 'Gdansk port', ['site', 'port'], [t(7, '08:00'), t(7, '13:00')]),
      leg('sea', 'portline', 'Gdansk port', 'Tarragona port', ['port', 'port'], [t(8, '04:00'), t(12, '06:00')]),
      leg('road', 'iberroute', 'Tarragona port', 'Zaragoza plant', ['port', 'site'], [t(12, '10:00'), t(12, '18:00')]),
    ],
    events: [
      event('nordhaul', 'Collected', 'Gdansk', 0, t(7, '08:00')),
      event('nordhaul', 'Linehaul', 'Gdansk', 0, t(7, '10:00')),
      event('nordhaul', 'Delivered', 'Gdansk', 0, t(7, '12:00')),
      event('portline', 'Gate-in', 'Gdansk', 1, t(7, '15:30')),
      event('portline', 'Loaded on vessel', 'Gdansk', 1, t(8, '02:00')),
      event('portline', 'Departed', 'Gdansk', 1, t(8, '05:20')),
    ],
  }),

  // Single-leg road shipments.
  roadShipment({
    id: '12188',
    customerId: 'nordvik',
    operatorId: 'iberroute',
    origin: site('tarragona'),
    destination: place('Porto', 'PT'),
    departure: t(7, '08:00'),
    promisedAt: t(11, '10:00'),
    rows: [
      ['Tendered', 'Tarragona', t(7, '08:00')],
      ['Depot scan', 'Tarragona', t(7, '11:00')],
      ['In transit', 'Burgos', t(8, '09:40')],
    ],
    documents: documents({
      bill_of_lading: { status: 'missing', neededBy: 'collection at the Porto warehouse' },
    }),
  }),
  roadShipment({
    id: '12377',
    customerId: 'nordvik',
    operatorId: 'iberroute',
    origin: site('zaragoza'),
    destination: place('Bilbao', 'ES'),
    departure: t(7, '06:00'),
    promisedAt: t(8, '18:00'),
    rows: [
      ['Tendered', 'Zaragoza', t(7, '06:00')],
      ['In transit', 'Zaragoza', t(7, '07:30')], // 31 h before the demo clock
    ],
  }),
  roadShipment({
    id: '12402',
    customerId: 'nordvik',
    operatorId: 'nordhaul',
    origin: site('tarragona'),
    destination: place('Seville', 'ES'),
    departure: t(7, '16:00'),
    promisedAt: t(10, '12:00'),
    rows: [
      ['Collected', 'Tarragona', t(7, '16:00')],
      ['Linehaul', 'Valencia', t(8, '06:15')],
    ],
  }),
  roadShipment({
    id: '12210',
    customerId: 'nordvik',
    operatorId: 'nordhaul',
    origin: site('zaragoza'),
    destination: site('lyon'),
    departure: t(7, '07:00'),
    promisedAt: t(8, '10:00'),
    rows: [
      ['Collected', 'Zaragoza', t(7, '07:30')],
      ['Linehaul', 'Perpignan', t(7, '12:30')],
      ['With driver', 'Lyon', t(8, '07:40')],
      ['Delivered', 'Lyon', t(8, '09:12')],
    ],
  }),
  roadShipment({
    id: '12455',
    customerId: 'lusitania',
    operatorId: 'iberroute',
    origin: site('zaragoza'),
    destination: place('Madrid', 'ES'),
    departure: t(8, '05:30'),
    promisedAt: t(8, '20:00'),
    rows: [
      ['Tendered', 'Zaragoza', t(8, '05:30')],
      ['In transit', 'Guadalajara', t(8, '09:00'), { delayHours: 6 }],
    ],
  }),
  roadShipment({
    id: '12466',
    customerId: 'rhone',
    operatorId: 'nordhaul',
    origin: site('zaragoza'),
    destination: site('lyon'),
    departure: t(7, '22:00'),
    promisedAt: t(9, '12:00'),
    rows: [
      ['Collected', 'Zaragoza', t(7, '22:40')],
      ['Linehaul', 'Perpignan', t(8, '04:10'), { delayHours: 30 }],
    ],
  }),
  roadShipment({
    id: '12418',
    customerId: 'rhone',
    operatorId: 'iberroute',
    origin: site('zaragoza'),
    destination: place('Valencia', 'ES'),
    departure: t(7, '09:00'),
    promisedAt: t(8, '17:00'),
    rows: [
      ['Tendered', 'Zaragoza', t(7, '09:00')],
      ['Depot scan', 'Zaragoza', t(7, '12:30')], // 26 h before the demo clock
    ],
  }),
  roadShipment({
    id: '12444',
    customerId: 'lusitania',
    operatorId: 'nordhaul',
    origin: site('tarragona'),
    destination: place('Barcelona', 'ES'),
    departure: t(8, '05:00'),
    promisedAt: t(8, '09:00'),
    rows: [
      ['Collected', 'Tarragona', t(8, '05:00')],
      ['Linehaul', 'Tarragona', t(8, '06:00')],
      ['With driver', 'Barcelona', t(8, '07:10')],
      ['Delivered', 'Barcelona', t(8, '07:50')],
    ],
  }),
  roadShipment({
    id: '12301',
    customerId: 'vistula',
    operatorId: 'nordhaul',
    origin: site('zaragoza'),
    destination: place('Barcelona', 'ES'),
    departure: t(6, '08:00'),
    promisedAt: t(6, '17:00'),
    rows: [
      ['Collected', 'Zaragoza', t(6, '08:00')],
      ['Linehaul', 'Lleida', t(6, '10:30')],
      ['With driver', 'Barcelona', t(6, '13:40')],
      ['Delivered', 'Barcelona', t(6, '15:10')],
    ],
  }),
  roadShipment({
    id: '12326',
    customerId: 'vistula',
    operatorId: 'iberroute',
    origin: site('zaragoza'),
    destination: place('Milan', 'IT'),
    departure: t(7, '19:00'),
    promisedAt: t(10, '16:00'),
    rows: [
      ['Tendered', 'Zaragoza', t(7, '19:00')],
      ['Depot scan', 'Zaragoza', t(7, '21:30')],
      ['In transit', 'Perpignan', t(8, '08:20')],
    ],
  }),
  roadShipment({
    id: '12352',
    customerId: 'lusitania',
    operatorId: 'nordhaul',
    origin: site('tarragona'),
    destination: place('Lisbon', 'PT'),
    departure: t(7, '17:00'),
    promisedAt: t(10, '18:00'),
    rows: [
      ['Collected', 'Tarragona', t(7, '17:00')],
      ['Linehaul', 'Madrid', t(8, '05:40')],
    ],
  }),
  roadShipment({
    id: '12369',
    customerId: 'rhone',
    operatorId: 'nordhaul',
    origin: site('lyon'),
    destination: site('zaragoza'),
    departure: t(7, '15:30'),
    promisedAt: t(9, '12:00'),
    rows: [
      ['Collected', 'Lyon', t(7, '15:30')],
      ['Linehaul', 'Narbonne', t(8, '11:00')],
    ],
  }),
  roadShipment({
    id: '12396',
    customerId: 'rhone',
    operatorId: 'nordhaul',
    origin: site('lyon'),
    destination: site('tarragona'),
    departure: t(8, '06:30'),
    promisedAt: t(9, '17:00'),
    rows: [
      ['Collected', 'Lyon', t(8, '06:30')],
      ['Linehaul', 'Montpellier', t(8, '11:15')],
    ],
  }),
  roadShipment({
    id: '12415',
    customerId: 'lusitania',
    operatorId: 'iberroute',
    origin: site('zaragoza'),
    destination: place('Porto', 'PT'),
    departure: t(6, '07:00'),
    promisedAt: t(7, '18:00'),
    rows: [
      ['Tendered', 'Zaragoza', t(6, '07:00')],
      ['Depot scan', 'Zaragoza', t(6, '09:00')],
      ['In transit', 'Burgos', t(6, '15:00')],
      ['OUT_FOR_DELIVERY', 'Porto', t(7, '13:30')],
      ['POD', 'Porto', t(7, '16:20')],
    ],
  }),
  roadShipment({
    id: '12420',
    customerId: 'vistula',
    operatorId: 'iberroute',
    origin: site('tarragona'),
    destination: place('Madrid', 'ES'),
    departure: t(8, '06:00'),
    promisedAt: t(8, '19:00'),
    rows: [
      ['Tendered', 'Tarragona', t(8, '06:00')],
      ['In transit', 'Zaragoza', t(8, '10:05')],
    ],
  }),
  roadShipment({
    id: '12448',
    customerId: 'lusitania',
    operatorId: 'nordhaul',
    origin: site('tarragona'),
    destination: place('Valencia', 'ES'),
    departure: t(8, '09:00'),
    promisedAt: t(8, '20:00'),
    rows: [
      ['Collected', 'Tarragona', t(8, '09:00')],
      ['Linehaul', 'Castellon', t(8, '12:40')],
    ],
  }),

  // Outside the ops perimeter: neither origin nor destination is a perimeter
  // site, and its customer has no other shipment. It must never surface.
  roadShipment({
    id: '20311',
    customerId: 'alpine',
    operatorId: 'nordhaul',
    origin: site('lyon'),
    destination: site('gdansk'),
    departure: t(7, '08:00'),
    promisedAt: t(10, '12:00'),
    rows: [
      ['Collected', 'Lyon', t(7, '08:30')],
      ['Linehaul', 'Munich', t(8, '08:00')],
    ],
  }),
]

export const SHIPMENTS_BY_ID = Object.fromEntries(SHIPMENTS.map((s) => [s.id, s]))
