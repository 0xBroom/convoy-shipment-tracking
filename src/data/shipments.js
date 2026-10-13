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
    promisedAt: t(17, '12:00'),
    legs: [
      leg('road', 'iberroute', 'Zaragoza plant', 'Tarragona port', ['site', 'port'], [t(11, '07:00'), t(11, '20:00')]),
      leg('sea', 'portline', 'Tarragona port', 'Gdansk port', ['port', 'port'], [t(12, '20:00'), t(16, '06:00')]),
      leg('customs', 'baltic-customs', 'Gdansk', 'Gdansk', ['customs', 'customs'], [t(16, '08:00'), t(16, '22:00')], {
        typicalHours: [24, 48],
      }),
      leg('road', 'nordhaul', 'Gdansk port', 'Nordvik, Gdansk', ['port', 'site'], [t(17, '06:00'), t(17, '12:00')]),
    ],
    events: [
      event('iberroute', 'Tendered', 'Zaragoza', 0, t(11, '07:40')),
      event('iberroute', 'Depot scan', 'Zaragoza', 0, t(11, '09:10')),
      event('iberroute', 'OUT_FOR_DELIVERY', 'Tarragona', 0, t(11, '18:05')),
      event('iberroute', 'POD', 'Tarragona', 0, t(11, '19:30')),
      event('portline', 'Gate-in', 'Tarragona', 1, t(11, '21:30')),
      event('portline', 'Loaded on vessel', 'Tarragona', 1, t(12, '15:00')),
      event('baltic-customs', 'Docs lodged', 'Gdansk', 2, t(13, '10:00')),
      event('portline', 'ROLLED', 'Tarragona', 1, t(13, '13:10'), { delayHours: 18 }),
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
    promisedAt: t(16, '18:00'),
    legs: [
      leg('road', 'iberroute', 'Tarragona warehouse', 'Tarragona port', ['site', 'port'], [t(10, '08:00'), t(10, '18:00')]),
      leg('sea', 'portline', 'Tarragona port', 'Gdansk port', ['port', 'port'], [t(11, '18:00'), t(15, '06:00')]),
      leg('customs', 'baltic-customs', 'Gdansk', 'Gdansk', ['customs', 'customs'], [t(15, '08:00'), t(16, '08:00')], {
        typicalHours: [24, 48],
      }),
      leg('road', 'nordhaul', 'Gdansk port', 'Nordvik, Gdansk', ['port', 'site'], [t(16, '12:00'), t(16, '18:00')]),
    ],
    events: [
      event('iberroute', 'Tendered', 'Tarragona', 0, t(10, '08:15')),
      event('iberroute', 'Depot scan', 'Tarragona', 0, t(10, '10:00')),
      event('iberroute', 'OUT_FOR_DELIVERY', 'Tarragona', 0, t(10, '15:40')),
      event('iberroute', 'POD', 'Tarragona', 0, t(10, '17:20')),
      event('portline', 'Gate-in', 'Tarragona', 1, t(10, '19:00')),
      event('portline', 'Loaded on vessel', 'Tarragona', 1, t(11, '14:00')),
      event('baltic-customs', 'Docs lodged', 'Gdansk', 2, t(11, '11:00')),
      event('baltic-customs', 'Held for inspection', 'Gdansk', 2, t(12, '16:40')),
      event('portline', 'ROLLED', 'Tarragona', 1, t(13, '13:10'), { delayHours: 18 }),
    ],
    documents: documents({
      customs_declaration: {
        status: 'rejected',
        rejectedAt: t(12, '16:40'),
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
    promisedAt: t(17, '18:00'),
    legs: [
      leg('road', 'iberroute', 'Tarragona warehouse', 'Tarragona port', ['site', 'port'], [t(10, '09:00'), t(10, '19:00')]),
      leg('sea', 'portline', 'Tarragona port', 'Gdansk port', ['port', 'port'], [t(12, '20:00'), t(16, '08:00')]),
      leg('customs', 'baltic-customs', 'Gdansk', 'Gdansk', ['customs', 'customs'], [t(16, '10:00'), t(17, '10:00')], {
        typicalHours: [12, 24],
      }),
      leg('road', 'nordhaul', 'Gdansk port', 'Lusitania Parts, Gdansk', ['port', 'site'], [t(17, '12:00'), t(17, '18:00')]),
    ],
    events: [
      event('iberroute', 'Tendered', 'Tarragona', 0, t(10, '09:00')),
      event('iberroute', 'Depot scan', 'Tarragona', 0, t(10, '11:30')),
      event('iberroute', 'OUT_FOR_DELIVERY', 'Tarragona', 0, t(10, '17:10')),
      event('iberroute', 'POD', 'Tarragona', 0, t(10, '18:45')),
      event('portline', 'Gate-in', 'Tarragona', 1, t(10, '21:00')),
      event('portline', 'Loaded on vessel', 'Tarragona', 1, t(12, '11:00')),
      event('baltic-customs', 'Docs lodged', 'Gdansk', 2, t(13, '09:30')),
      event('portline', 'ROLLED', 'Tarragona', 1, t(13, '13:10'), { delayHours: 18 }),
    ],
    flags: { incidentId: 'tarragona-rollover' },
  }),

  // Held for inspection at Gdansk after arriving on schedule.
  shipment({
    id: '12439',
    customerId: 'vistula',
    origin: site('tarragona'),
    destination: site('gdansk'),
    promisedAt: t(14, '14:00'),
    legs: [
      leg('road', 'iberroute', 'Tarragona warehouse', 'Tarragona port', ['site', 'port'], [t(7, '08:00'), t(7, '16:00')]),
      leg('sea', 'medlines', 'Tarragona port', 'Gdansk port', ['port', 'port'], [t(8, '22:00'), t(12, '18:00')]),
      leg('customs', 'baltic-customs', 'Gdansk', 'Gdansk', ['customs', 'customs'], [t(12, '20:00'), t(13, '20:00')], {
        typicalHours: [24, 48],
      }),
      leg('road', 'nordhaul', 'Gdansk port', 'Vistula Components, Gdansk', ['port', 'site'], [t(14, '08:00'), t(14, '14:00')]),
    ],
    events: [
      event('iberroute', 'Tendered', 'Tarragona', 0, t(7, '08:00')),
      event('iberroute', 'Depot scan', 'Tarragona', 0, t(7, '10:00')),
      event('iberroute', 'OUT_FOR_DELIVERY', 'Tarragona', 0, t(7, '13:00')),
      event('iberroute', 'POD', 'Tarragona', 0, t(7, '14:30')),
      event('medlines', 'GATE IN', 'Tarragona', 1, t(7, '17:00')),
      event('medlines', 'VSL LOAD', 'Tarragona', 1, t(8, '10:00')),
      event('medlines', 'VSL DEP', 'Tarragona', 1, t(8, '22:00')),
      event('baltic-customs', 'Docs lodged', 'Gdansk', 2, t(9, '09:00')),
      event('medlines', 'VSL ARR', 'Gdansk', 1, t(12, '18:00')),
      event('medlines', 'DISCH', 'Gdansk', 1, t(12, '21:30')),
      event('baltic-customs', 'Under review', 'Gdansk', 2, t(12, '23:10')),
      event('baltic-customs', 'Held for inspection', 'Gdansk', 2, t(13, '08:40')),
    ],
  }),

  // Healthy multimodal shipment: vessel departed on time this morning.
  shipment({
    id: '12384',
    customerId: 'vistula',
    origin: site('tarragona'),
    destination: site('gdansk'),
    promisedAt: t(18, '14:00'),
    legs: [
      leg('road', 'iberroute', 'Tarragona warehouse', 'Tarragona port', ['site', 'port'], [t(11, '08:00'), t(11, '14:30')]),
      leg('sea', 'medlines', 'Tarragona port', 'Gdansk port', ['port', 'port'], [t(12, '22:00'), t(16, '10:00')]),
      leg('customs', 'baltic-customs', 'Gdansk', 'Gdansk', ['customs', 'customs'], [t(16, '12:00'), t(17, '12:00')], {
        typicalHours: [12, 24],
      }),
      leg('road', 'nordhaul', 'Gdansk port', 'Vistula Components, Gdansk', ['port', 'site'], [t(18, '08:00'), t(18, '14:00')]),
    ],
    events: [
      event('iberroute', 'Tendered', 'Tarragona', 0, t(11, '08:30')),
      event('iberroute', 'Depot scan', 'Tarragona', 0, t(11, '10:00')),
      event('iberroute', 'OUT_FOR_DELIVERY', 'Tarragona', 0, t(11, '12:40')),
      event('iberroute', 'POD', 'Tarragona', 0, t(11, '13:55')),
      event('medlines', 'GATE IN', 'Tarragona', 1, t(11, '16:00')),
      event('medlines', 'VSL LOAD', 'Tarragona', 1, t(12, '10:00')),
      event('medlines', 'VSL DEP', 'Tarragona', 1, t(12, '22:00')),
    ],
  }),

  // Delayed vessel to Marseille with a French broker (French raw statuses).
  shipment({
    id: '12471',
    customerId: 'rhone',
    origin: site('tarragona'),
    destination: place('Marseille', 'FR'),
    promisedAt: t(13, '18:00'),
    legs: [
      leg('road', 'iberroute', 'Tarragona warehouse', 'Tarragona port', ['site', 'port'], [t(9, '08:00'), t(9, '15:00')]),
      leg('sea', 'medlines', 'Tarragona port', 'Marseille port', ['port', 'port'], [t(10, '03:00'), t(11, '03:00')]),
      leg('customs', 'rhone-brokers', 'Marseille', 'Marseille', ['customs', 'customs'], [t(11, '06:00'), t(12, '06:00')], {
        typicalHours: [12, 24],
      }),
      leg('road', 'nordhaul', 'Marseille port', 'Rhone Industries, Marseille', ['port', 'site'], [t(13, '06:00'), t(13, '18:00')]),
    ],
    events: [
      event('iberroute', 'Tendered', 'Tarragona', 0, t(9, '08:00')),
      event('iberroute', 'Depot scan', 'Tarragona', 0, t(9, '10:00')),
      event('iberroute', 'OUT_FOR_DELIVERY', 'Tarragona', 0, t(9, '13:00')),
      event('iberroute', 'POD', 'Tarragona', 0, t(9, '14:20')),
      event('medlines', 'GATE IN', 'Tarragona', 1, t(9, '17:00')),
      event('rhone-brokers', 'Déclaration déposée', 'Marseille', 2, t(11, '09:00')),
      event('medlines', 'VSL LOAD', 'Tarragona', 1, t(12, '09:00')),
      event('medlines', 'VSL DEP', 'Tarragona', 1, t(13, '03:00'), { delayHours: 144 }),
    ],
  }),

  // Inbound from Gdansk, vessel just departed. No customs leg inside the EU.
  shipment({
    id: '12392',
    customerId: 'lusitania',
    origin: site('gdansk'),
    destination: site('zaragoza'),
    promisedAt: t(17, '18:00'),
    legs: [
      leg('road', 'nordhaul', 'Gdansk', 'Gdansk port', ['site', 'port'], [t(12, '08:00'), t(12, '13:00')]),
      leg('sea', 'portline', 'Gdansk port', 'Tarragona port', ['port', 'port'], [t(13, '04:00'), t(17, '06:00')]),
      leg('road', 'iberroute', 'Tarragona port', 'Zaragoza plant', ['port', 'site'], [t(17, '10:00'), t(17, '18:00')]),
    ],
    events: [
      event('nordhaul', 'Collected', 'Gdansk', 0, t(12, '08:00')),
      event('nordhaul', 'Linehaul', 'Gdansk', 0, t(12, '10:00')),
      event('nordhaul', 'Delivered', 'Gdansk', 0, t(12, '12:00')),
      event('portline', 'Gate-in', 'Gdansk', 1, t(12, '15:30')),
      event('portline', 'Loaded on vessel', 'Gdansk', 1, t(13, '02:00')),
      event('portline', 'Departed', 'Gdansk', 1, t(13, '05:20')),
    ],
  }),

  // Single-leg road shipments.
  roadShipment({
    id: '12188',
    customerId: 'nordvik',
    operatorId: 'iberroute',
    origin: site('tarragona'),
    destination: place('Porto', 'PT'),
    departure: t(12, '08:00'),
    promisedAt: t(16, '10:00'),
    rows: [
      ['Tendered', 'Tarragona', t(12, '08:00')],
      ['Depot scan', 'Tarragona', t(12, '11:00')],
      ['In transit', 'Burgos', t(13, '09:40')],
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
    departure: t(12, '06:00'),
    promisedAt: t(13, '18:00'),
    rows: [
      ['Tendered', 'Zaragoza', t(12, '06:00')],
      ['In transit', 'Zaragoza', t(12, '07:30')], // 31 h before the demo clock
    ],
  }),
  roadShipment({
    id: '12402',
    customerId: 'nordvik',
    operatorId: 'nordhaul',
    origin: site('tarragona'),
    destination: place('Seville', 'ES'),
    departure: t(12, '16:00'),
    promisedAt: t(15, '12:00'),
    rows: [
      ['Collected', 'Tarragona', t(12, '16:00')],
      ['Linehaul', 'Valencia', t(13, '06:15')],
    ],
  }),
  roadShipment({
    id: '12210',
    customerId: 'nordvik',
    operatorId: 'nordhaul',
    origin: site('zaragoza'),
    destination: site('lyon'),
    departure: t(12, '07:00'),
    promisedAt: t(13, '10:00'),
    rows: [
      ['Collected', 'Zaragoza', t(12, '07:30')],
      ['Linehaul', 'Perpignan', t(12, '12:30')],
      ['With driver', 'Lyon', t(13, '07:40')],
      ['Delivered', 'Lyon', t(13, '09:12')],
    ],
  }),
  roadShipment({
    id: '12455',
    customerId: 'lusitania',
    operatorId: 'iberroute',
    origin: site('zaragoza'),
    destination: place('Madrid', 'ES'),
    departure: t(13, '05:30'),
    promisedAt: t(13, '20:00'),
    rows: [
      ['Tendered', 'Zaragoza', t(13, '05:30')],
      ['In transit', 'Guadalajara', t(13, '09:00'), { delayHours: 6 }],
    ],
  }),
  roadShipment({
    id: '12466',
    customerId: 'rhone',
    operatorId: 'nordhaul',
    origin: site('zaragoza'),
    destination: site('lyon'),
    departure: t(12, '22:00'),
    promisedAt: t(14, '12:00'),
    rows: [
      ['Collected', 'Zaragoza', t(12, '22:40')],
      ['Linehaul', 'Perpignan', t(13, '04:10'), { delayHours: 30 }],
    ],
  }),
  roadShipment({
    id: '12418',
    customerId: 'rhone',
    operatorId: 'iberroute',
    origin: site('zaragoza'),
    destination: place('Valencia', 'ES'),
    departure: t(12, '09:00'),
    promisedAt: t(13, '17:00'),
    rows: [
      ['Tendered', 'Zaragoza', t(12, '09:00')],
      ['Depot scan', 'Zaragoza', t(12, '12:30')], // 26 h before the demo clock
    ],
  }),
  roadShipment({
    id: '12444',
    customerId: 'lusitania',
    operatorId: 'nordhaul',
    origin: site('tarragona'),
    destination: place('Barcelona', 'ES'),
    departure: t(13, '05:00'),
    promisedAt: t(13, '09:00'),
    rows: [
      ['Collected', 'Tarragona', t(13, '05:00')],
      ['Linehaul', 'Tarragona', t(13, '06:00')],
      ['With driver', 'Barcelona', t(13, '07:10')],
      ['Delivered', 'Barcelona', t(13, '07:50')],
    ],
  }),
  roadShipment({
    id: '12301',
    customerId: 'vistula',
    operatorId: 'nordhaul',
    origin: site('zaragoza'),
    destination: place('Barcelona', 'ES'),
    departure: t(11, '08:00'),
    promisedAt: t(11, '17:00'),
    rows: [
      ['Collected', 'Zaragoza', t(11, '08:00')],
      ['Linehaul', 'Lleida', t(11, '10:30')],
      ['With driver', 'Barcelona', t(11, '13:40')],
      ['Delivered', 'Barcelona', t(11, '15:10')],
    ],
  }),
  roadShipment({
    id: '12326',
    customerId: 'vistula',
    operatorId: 'iberroute',
    origin: site('zaragoza'),
    destination: place('Milan', 'IT'),
    departure: t(12, '19:00'),
    promisedAt: t(15, '16:00'),
    rows: [
      ['Tendered', 'Zaragoza', t(12, '19:00')],
      ['Depot scan', 'Zaragoza', t(12, '21:30')],
      ['In transit', 'Perpignan', t(13, '08:20')],
    ],
  }),
  roadShipment({
    id: '12352',
    customerId: 'lusitania',
    operatorId: 'nordhaul',
    origin: site('tarragona'),
    destination: place('Lisbon', 'PT'),
    departure: t(12, '17:00'),
    promisedAt: t(15, '18:00'),
    rows: [
      ['Collected', 'Tarragona', t(12, '17:00')],
      ['Linehaul', 'Madrid', t(13, '05:40')],
    ],
  }),
  roadShipment({
    id: '12369',
    customerId: 'rhone',
    operatorId: 'nordhaul',
    origin: site('lyon'),
    destination: site('zaragoza'),
    departure: t(12, '15:30'),
    promisedAt: t(14, '12:00'),
    rows: [
      ['Collected', 'Lyon', t(12, '15:30')],
      ['Linehaul', 'Narbonne', t(13, '11:00')],
    ],
  }),
  roadShipment({
    id: '12396',
    customerId: 'rhone',
    operatorId: 'nordhaul',
    origin: site('lyon'),
    destination: site('tarragona'),
    departure: t(13, '06:30'),
    promisedAt: t(14, '17:00'),
    rows: [
      ['Collected', 'Lyon', t(13, '06:30')],
      ['Linehaul', 'Montpellier', t(13, '11:15')],
    ],
  }),
  roadShipment({
    id: '12415',
    customerId: 'lusitania',
    operatorId: 'iberroute',
    origin: site('zaragoza'),
    destination: place('Porto', 'PT'),
    departure: t(11, '07:00'),
    promisedAt: t(12, '18:00'),
    rows: [
      ['Tendered', 'Zaragoza', t(11, '07:00')],
      ['Depot scan', 'Zaragoza', t(11, '09:00')],
      ['In transit', 'Burgos', t(11, '15:00')],
      ['OUT_FOR_DELIVERY', 'Porto', t(12, '13:30')],
      ['POD', 'Porto', t(12, '16:20')],
    ],
  }),
  roadShipment({
    id: '12420',
    customerId: 'vistula',
    operatorId: 'iberroute',
    origin: site('tarragona'),
    destination: place('Madrid', 'ES'),
    departure: t(13, '06:00'),
    promisedAt: t(13, '19:00'),
    rows: [
      ['Tendered', 'Tarragona', t(13, '06:00')],
      ['In transit', 'Zaragoza', t(13, '10:05')],
    ],
  }),
  roadShipment({
    id: '12448',
    customerId: 'lusitania',
    operatorId: 'nordhaul',
    origin: site('tarragona'),
    destination: place('Valencia', 'ES'),
    departure: t(13, '09:00'),
    promisedAt: t(13, '20:00'),
    rows: [
      ['Collected', 'Tarragona', t(13, '09:00')],
      ['Linehaul', 'Castellon', t(13, '12:40')],
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
    departure: t(12, '08:00'),
    promisedAt: t(15, '12:00'),
    rows: [
      ['Collected', 'Lyon', t(12, '08:30')],
      ['Linehaul', 'Munich', t(13, '08:00')],
    ],
  }),
]

export const SHIPMENTS_BY_ID = Object.fromEntries(SHIPMENTS.map((s) => [s.id, s]))
