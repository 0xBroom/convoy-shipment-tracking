import { CUSTOMERS_BY_ID } from '../data/customers.js'
import { docLabel, documentFileName } from '../data/documents.js'
import { LANGUAGES } from '../data/languages.js'
import { NOW } from '../data/now.js'
import { OPERATORS_BY_ID } from '../data/operators.js'
import { documentRecipient } from '../lib/documents.js'
import { fmtDate, fmtDateFr, fmtDateTime, fmtDateTimeFr } from '../lib/format.js'
import { contactTarget } from '../lib/shipment.js'

// Message drafts are templates over facts. Convoy drafts; a person edits and
// confirms. Nothing here sends anything.
//
// Every draft is written in the recipient's language by default: the
// customer's account language for a notice, the operator's own language for
// the rest. Pass `language` to write in the other one. Only the message is
// translated; the UI around it stays in English.

const routeOf = (view) => `${view.origin.city} to ${view.destination.city}`
const routeFr = (view) => `${view.origin.city} à ${view.destination.city}`

// French typography: a no-break space before ? and :, guillemets around quotes.
const NBSP = ' '
const quoteFr = (text) => `«${NBSP}${text}${NBSP}»`

// "Rhone Industries' account", "Nordvik Subsidiary's account".
const possessive = (name) => (name.endsWith('s') ? `${name}'` : `${name}'s`)

// Who the draft goes to and which language they read, with the reason the
// dialog shows next to it. The customer for a notice, else the operator.
export function recipientLanguage(view, action) {
  if (action.type === 'notify') {
    const customer = CUSTOMERS_BY_ID[view.customerId]
    return {
      language: customer.language,
      reason: `${possessive(customer.name)} account language is ${LANGUAGES[customer.language]}`,
    }
  }
  const operator =
    action.type === 'contact_operator'
      ? OPERATORS_BY_ID[contactTarget(view).operatorId]
      : documentRecipient(view, action.docType)
  return {
    language: operator.language,
    reason: `${operator.name} posts its statuses in ${LANGUAGES[operator.language]}`,
  }
}

// What the customer is waiting for next, from the data: the vessel, customs
// or the port formalities, or the last leg.
function nextMilestone(view, language) {
  const last = view.timeline.at(-1)
  const sea = view.legs.find((l) => l.mode === 'sea')
  const discharged = view.timeline.some((e) => e.milestone === 'discharged')
  const cleared = view.timeline.some((e) => view.legs[e.legIndex]?.mode === 'customs' && e.milestone === 'cleared')
  const customs = view.legs.find((l) => l.mode === 'customs')
  const fr = language === 'fr'
  if (sea && !discharged) {
    const port = sea.to.replace(/ port$/, '')
    return fr ? `que le navire est déchargé à ${port}` : `the vessel is discharged at ${port}`
  }
  if (customs && !cleared) {
    if (customs.formality === 'union_status') {
      return fr ? `que le port la libère à ${customs.from}` : `the port releases it at ${customs.from}`
    }
    return fr ? `que la douane la libère à ${customs.from}` : `customs clears it at ${customs.from}`
  }
  if (last) return fr ? `que le camion est en cours de livraison` : `the truck is out for delivery`
  return fr ? `que l'expédition est enlevée` : 'the shipment is collected'
}

// The delay cause for the notice, from the first risk reason that names one.
// English keeps the reason's own words; French names the same four causes.
const CAUSES_FR = {
  Vessel: 'un retard du navire',
  Road: 'un retard routier',
  Customs: 'un retard en douane',
  Port: 'un retard dans les formalités portuaires',
}

function delayCause(view, language) {
  const cause = view.risk.reasons.find((r) => /delay/i.test(r.text))
  if (!cause) return ''
  const where = view.timeline.find((e) => e.delayHours > 0)?.location
  if (language === 'fr') {
    const named = CAUSES_FR[cause.text.split(' ')[0]] ?? 'un retard'
    return `, en raison d'${named}${where ? ` à ${where}` : ''}`
  }
  const named = cause.text.replace(/ \d+ (day|days|h)$/, '').toLowerCase()
  return ` because of a ${named}${where ? ` at ${where}` : ''}`
}

const CONFIDENCE_FR = { low: 'faible', medium: 'moyenne', high: 'élevée' }

// Customer notice: order, route, new estimate and confidence, cause, next update.
export function draftNotice(view, { language = CUSTOMERS_BY_ID[view.customerId].language, now = NOW } = {}) {
  const est = view.estimate
  const updateBy = new Date(now.getTime() + 24 * 3_600_000)
  const last = view.timeline.at(-1)

  if (language === 'fr') {
    const opening = `Votre expédition pour la commande ${view.id} (${routeFr(view)})`
    const nextUpdate =
      `Nous vous tiendrons informés d'ici le ${fmtDateFr(updateBy)} à 12:00, ` +
      `ou plus tôt dès ${nextMilestone(view, 'fr')}.`
    if (est?.moved) {
      const days = Math.round(est.delayHours / 24)
      const later = days >= 1 ? `environ ${days} jour${days === 1 ? '' : 's'}` : `environ ${Math.round(est.delayHours)} h`
      const arrival = est.confirmed
        ? `Nouvelle heure d'arrivée${NBSP}: ${fmtDateTimeFr(est.value)} (confirmée par ${est.operatorName}).`
        : `Nouvelle arrivée estimée${NBSP}: ${fmtDateTimeFr(est.value)} (estimation, confiance ${CONFIDENCE_FR[est.confidence]}).`
      return `${opening} arrivera ${later} plus tard que prévu${delayCause(view, 'fr')}. ${arrival} ${nextUpdate}`
    }
    return (
      `${opening} n'a reçu aucune mise à jour confirmée depuis ${last ? `le ${fmtDateTimeFr(last.at)}` : 'sa réservation'}. ` +
      `Nous vérifions auprès du transporteur et vous préviendrons si la date d'arrivée change. ${nextUpdate}`
    )
  }

  const opening = `Your shipment for order ${view.id} (${routeOf(view)})`
  const nextUpdate = `We will update you by ${fmtDate(updateBy)}, 12:00, or sooner once ${nextMilestone(view, 'en')}.`
  if (est?.moved) {
    const days = Math.round(est.delayHours / 24)
    const later = days >= 1 ? `about ${days} ${days === 1 ? 'day' : 'days'}` : `about ${Math.round(est.delayHours)} h`
    const arrival = est.confirmed
      ? `New arrival time: ${fmtDateTime(est.value)} (confirmed by ${est.operatorName}).`
      : `New estimated arrival: ${fmtDateTime(est.value)} (estimate, ${est.confidence} confidence).`
    return `${opening} will arrive ${later} later than planned${delayCause(view, 'en')}. ${arrival} ${nextUpdate}`
  }
  return (
    `${opening} has had no confirmed update since ${last ? fmtDateTime(last.at) : 'it was booked'}. ` +
    `We are checking with the carrier and will tell you if the arrival date changes. ${nextUpdate}`
  )
}

// Document names and the "needed before" phrases in French. The phrases are
// data ("release at Gdansk"); the two shapes the fixtures use are translated,
// anything else is kept as written.
const DOC_LABELS_FR = {
  invoice: 'la facture commerciale',
  packing_list: 'la liste de colisage',
  bill_of_lading: 'le connaissement ou la CMR',
  union_status: `la preuve du statut de l'Union (T2L)`,
  customs_declaration: 'la déclaration en douane',
}

function neededByFr(text) {
  const release = text.match(/^release at (.+)$/)
  if (release) return `la mainlevée à ${release[1]}`
  const clearance = text.match(/^import clearance at (.+)$/)
  if (clearance) return `le dédouanement à ${clearance[1]}`
  return text
}

const operatorLanguage = (operator) => operator.language

// Request to the operator that owns a missing or rejected document.
export function draftDocumentRequest(view, docType, { language = operatorLanguage(documentRecipient(view, docType)) } = {}) {
  const doc = view.documents.find((d) => d.type === docType)
  const to = documentRecipient(view, docType)

  if (language === 'fr') {
    const label = DOC_LABELS_FR[docType]
    const when = doc.neededBy ? ` avant ${neededByFr(doc.neededBy)}` : ''
    const lead =
      doc.status === 'rejected'
        ? `${label} pour la commande ${view.id} (${routeFr(view)}) a été rejetée le ${fmtDateTimeFr(doc.rejectedAt)}. Nous avons besoin d'une version corrigée${when}`
        : `nous avons besoin de ${label} pour la commande ${view.id} (${routeFr(view)})${when}`
    return `Bonjour ${to.name}, ${lead}. Merci de nous l'envoyer par retour, ou de nous indiquer quand nous pouvons l'attendre.`
  }

  const label = docLabel(docType)
  const when = doc.neededBy ? ` before ${doc.neededBy}` : ''
  const lead =
    doc.status === 'rejected'
      ? `the ${label} for order ${view.id} (${routeOf(view)}) was rejected on ${fmtDateTime(doc.rejectedAt)}. We need a corrected version${when}`
      : `we need the ${label} for order ${view.id} (${routeOf(view)})${when}`
  return `Hello ${to.name}, ${lead}. Please send it by reply, or tell us when we can expect it.`
}

// One of our own documents, sent with the file attached to the party that
// needs it next. A rejected document goes out as a corrected version.
export function draftDocumentSend(view, docType, { language = operatorLanguage(documentRecipient(view, docType)) } = {}) {
  const doc = view.documents.find((d) => d.type === docType)
  const to = documentRecipient(view, docType)
  const file = documentFileName(docType, view.id)

  if (language === 'fr') {
    const label = DOC_LABELS_FR[docType]
    const when = doc.neededBy ? `, nécessaire avant ${neededByFr(doc.neededBy)}` : ''
    const corrected =
      doc.status === 'rejected'
        ? ` Il s'agit de la version corrigée, qui remplace celle rejetée le ${fmtDateTimeFr(doc.rejectedAt)}.`
        : ''
    return (
      `Bonjour ${to.name}, veuillez trouver ci-joint ${label} pour la commande ${view.id} (${routeFr(view)})${when}${NBSP}: ` +
      `${file}.${corrected} Merci d'en accuser réception, ou de nous dire si autre chose est nécessaire.`
    )
  }

  const label = docLabel(docType)
  const when = doc.neededBy ? `, needed before ${doc.neededBy}` : ''
  const corrected =
    doc.status === 'rejected'
      ? ` This is the corrected version, replacing the one rejected on ${fmtDateTime(doc.rejectedAt)}.`
      : ''
  return (
    `Hello ${to.name}, please find attached the ${label} for order ${view.id} (${routeOf(view)})${when}: ` +
    `${file}.${corrected} Please confirm receipt, or tell us if anything else is needed.`
  )
}

// Question to the operator that owns the last status. Quotes the raw status.
export function draftOperatorMessage(view, { language = operatorLanguage(OPERATORS_BY_ID[contactTarget(view).operatorId]) } = {}) {
  const target = contactTarget(view)
  const { raw, location, at } = target.event
  const hold = view.risk.tags.includes('customs_hold')

  if (language === 'fr') {
    const ask = hold
      ? `Que faut-il pour libérer l'expédition, et quand attendez-vous la décision${NBSP}?`
      : 'Merci de nous indiquer la position actuelle et la prochaine étape prévue.'
    return (
      `Bonjour ${target.operatorName}, pouvez-vous confirmer le statut de la commande ${view.id} (${routeFr(view)})${NBSP}? ` +
      `Votre dernier statut était ${quoteFr(raw)} à ${location} le ${fmtDateTimeFr(at)}. ${ask}`
    )
  }

  const ask = hold
    ? 'What is needed to release the shipment, and when do you expect the decision?'
    : 'Please reply with the current position and the next expected milestone.'
  return (
    `Hello ${target.operatorName}, can you confirm the status of order ${view.id} (${routeOf(view)})? ` +
    `Your last status was '${raw}' at ${location} on ${fmtDateTime(at)}. ${ask}`
  )
}
