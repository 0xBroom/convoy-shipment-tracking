export const DOCUMENT_TYPES = ['invoice', 'packing_list', 'bill_of_lading', 'customs_declaration']

export const DOCUMENT_LABELS = {
  invoice: 'Commercial invoice',
  packing_list: 'Packing list',
  bill_of_lading: 'Bill of lading or CMR',
  customs_declaration: 'Customs declaration',
}

// Who issues each document. The manufacturer (the shipper, our own side)
// issues the invoice and the packing list, so Convoy sends those; the carrier
// issues the bill of lading or CMR and the broker files the declaration, so
// Convoy asks for those.
export const DOCUMENT_OWNERS = {
  invoice: 'shipper',
  packing_list: 'shipper',
  bill_of_lading: 'carrier',
  customs_declaration: 'broker',
}

export const isShipperDocument = (type) => DOCUMENT_OWNERS[type] === 'shipper'

// "invoice-12345.pdf": the file the ERP exports for a shipper document.
export const documentFileName = (type, shipmentId) => `${type.replace('_', '-')}-${shipmentId}.pdf`

// Lower-case label for use inside a sentence ("the bill of lading or CMR").
export const docLabel = (type) => DOCUMENT_LABELS[type].toLowerCase().replace('cmr', 'CMR')
