// The actions available on a shipment: notice and operator contact always,
// document requests only for documents that are missing or rejected.
export function actionsOf(view, { notice = true } = {}) {
  const docs = view.documents
    .filter((d) => d.status === 'missing' || d.status === 'rejected')
    .map((d) => ({ type: 'request_document', docType: d.type }))
  return [...(notice ? [{ type: 'notify' }] : []), ...docs, { type: 'contact_operator' }]
}
