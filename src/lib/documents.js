import { isShipperDocument } from '../data/documents.js'
import { OPERATORS_BY_ID } from '../data/operators.js'

// Which party a document conversation goes to, read from the shipment's legs
// so the same shipment always names the same operator.

const legOperator = (view, mode) => {
  const found = view.legs.find((leg) => leg.mode === mode)
  return found ? OPERATORS_BY_ID[found.operatorId] : null
}

const lastLegOperator = (view) => OPERATORS_BY_ID[view.legs.at(-1).operatorId]

// Shipper documents (invoice, packing list, T2L) go to whoever needs them
// next: the customs party when there is a customs leg, the import broker or
// the EU port agent, else the operator delivering. The bill of lading comes
// from the sea carrier, or the road carrier for a CMR. The declaration comes
// from the broker. The last leg's operator is the fallback, so there is
// always one.
export function documentRecipient(view, docType) {
  if (isShipperDocument(docType)) return legOperator(view, 'customs') ?? lastLegOperator(view)
  if (docType === 'bill_of_lading') return legOperator(view, 'sea') ?? legOperator(view, 'road') ?? lastLegOperator(view)
  return legOperator(view, 'customs') ?? lastLegOperator(view)
}

// The action on a document that is missing or rejected: our own documents are
// sent, the other parties' are requested.
export const documentActionType = (docType) => (isShipperDocument(docType) ? 'send_document' : 'request_document')
