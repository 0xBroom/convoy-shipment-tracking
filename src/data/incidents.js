// One port incident touching three shipments inside the ops perimeter. The
// crane failure rolled every Portline departure of the day, so the Oslo
// sailing (12345, 12411) and the Gdansk sailing (12290) are both on it.
export const INCIDENTS = {
  'tarragona-rollover': {
    id: 'tarragona-rollover',
    title: 'Sailings rolled at Tarragona',
    summary: 'Crane failure at Tarragona port. Portline rolled its Oslo and Gdansk sailings to the next departure; 18 h added to each shipment.',
    operatorId: 'portline',
    raw: 'ROLLED',
    siteId: 'tarragona',
    delayHours: 18,
    shipmentIds: ['12345', '12290', '12411'],
    resolved: false,
  },
}
