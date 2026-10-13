import { documentActionType } from './documents.js'

// The actions available on a shipment: notice and operator contact always,
// document actions only for documents that are missing or rejected (send for
// our own documents, request for the other parties').
export function actionsOf(view, { notice = true } = {}) {
  const docs = view.documents
    .filter((d) => d.status === 'missing' || d.status === 'rejected')
    .map((d) => ({ type: documentActionType(d.type), docType: d.type }))
  return [...(notice ? [{ type: 'notify' }] : []), ...docs, { type: 'contact_operator' }]
}
