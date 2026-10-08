// Five customer subsidiaries. 'alpine' only has the out-of-perimeter shipment,
// so searching for its name in ops must reveal nothing.
export const CUSTOMERS = [
  { id: 'nordvik', name: 'Nordvik Subsidiary' },
  { id: 'lusitania', name: 'Lusitania Parts' },
  { id: 'rhone', name: 'Rhone Industries' },
  { id: 'vistula', name: 'Vistula Components' },
  { id: 'alpine', name: 'Alpine Drives' },
]

export const CUSTOMERS_BY_ID = Object.fromEntries(CUSTOMERS.map((c) => [c.id, c]))
