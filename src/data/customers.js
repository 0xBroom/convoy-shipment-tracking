// Five customer subsidiaries. 'alpine' only has the out-of-perimeter shipment,
// so searching for its name in ops must reveal nothing. `language` is the
// account language, the default for notices Convoy drafts to the customer:
// Nordvik receives in Norway but runs its account in English.
export const CUSTOMERS = [
  { id: 'nordvik', name: 'Nordvik Subsidiary', language: 'en' },
  { id: 'lusitania', name: 'Lusitania Parts', language: 'en' },
  { id: 'rhone', name: 'Rhone Industries', language: 'fr' },
  { id: 'vistula', name: 'Vistula Components', language: 'en' },
  { id: 'alpine', name: 'Alpine Drives', language: 'en' },
]

export const CUSTOMERS_BY_ID = Object.fromEntries(CUSTOMERS.map((c) => [c.id, c]))
