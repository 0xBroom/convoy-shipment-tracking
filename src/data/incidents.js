// One port incident touching three shipments inside the ops perimeter.
export const INCIDENTS = {
  'tarragona-rollover': {
    id: 'tarragona-rollover',
    title: 'Vessel rollover at Tarragona',
    summary: 'Vessel rolled to the next sailing; 18 h added to each shipment.',
    operatorId: 'portline',
    raw: 'ROLLED',
    siteId: 'tarragona',
    delayHours: 18,
    shipmentIds: ['12345', '12290', '12411'],
    resolved: false,
  },
}
