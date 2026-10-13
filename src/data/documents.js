// Every document type Convoy knows. Which ones a shipment carries depends on
// its route (see documentTypesFor): there is no import clearance between EU
// member states, so a customs declaration only exists on a lane that leaves
// the customs union, and goods moved by sea between EU ports need proof of
// Union status (a T2L) instead.
export const DOCUMENT_TYPES = ['invoice', 'packing_list', 'bill_of_lading', 'union_status', 'customs_declaration']

export const DOCUMENT_LABELS = {
  invoice: 'Commercial invoice',
  packing_list: 'Packing list',
  bill_of_lading: 'Bill of lading or CMR',
  union_status: 'Proof of Union status (T2L)',
  customs_declaration: 'Customs declaration',
}

// Who issues each document. The manufacturer (the shipper, our own side)
// issues the invoice, the packing list and the T2L, so Convoy sends those; the
// carrier issues the bill of lading or CMR and the broker files the
// declaration, so Convoy asks for those.
export const DOCUMENT_OWNERS = {
  invoice: 'shipper',
  packing_list: 'shipper',
  bill_of_lading: 'carrier',
  union_status: 'shipper',
  customs_declaration: 'broker',
}

export const isShipperDocument = (type) => DOCUMENT_OWNERS[type] === 'shipper'

// The documents a route needs: the three every shipment has, plus the one its
// customs leg asks for. A customs leg carries `formality`: 'import' outside
// the customs union (a declaration), 'union_status' at an EU port (a T2L).
const BASE_DOCUMENT_TYPES = ['invoice', 'packing_list', 'bill_of_lading']
const FORMALITY_DOCUMENT = { import: 'customs_declaration', union_status: 'union_status' }

export function documentTypesFor(legs) {
  const customs = legs.find((leg) => leg.mode === 'customs')
  const extra = customs ? FORMALITY_DOCUMENT[customs.formality] : null
  return extra ? [...BASE_DOCUMENT_TYPES, extra] : BASE_DOCUMENT_TYPES
}

// "invoice-12345.pdf": the file the ERP exports for a shipper document.
export const documentFileName = (type, shipmentId) => `${type.replaceAll('_', '-')}-${shipmentId}.pdf`

// Lower-case label for use inside a sentence ("the bill of lading or CMR"),
// keeping the names and acronyms that stay capitalised.
const KEEP_CASE = ['CMR', 'T2L', 'Union']

export const docLabel = (type) =>
  KEEP_CASE.reduce((text, word) => text.replace(word.toLowerCase(), word), DOCUMENT_LABELS[type].toLowerCase())
