export const DOCUMENT_TYPES = ['invoice', 'packing_list', 'bill_of_lading', 'customs_declaration']

export const DOCUMENT_LABELS = {
  invoice: 'Commercial invoice',
  packing_list: 'Packing list',
  bill_of_lading: 'Bill of lading or CMR',
  customs_declaration: 'Customs declaration',
}

// Lower-case label for use inside a sentence ("the bill of lading or CMR").
export const docLabel = (type) => DOCUMENT_LABELS[type].toLowerCase().replace('cmr', 'CMR')
