import { MODE_LABELS } from '../data/milestones.js'

// "Zaragoza to Drammen": the short form used in lists.
export const routeShort = (view) => `${view.origin.city} to ${view.destination.city}`

const joinList = (items) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`

// What happens on a customs leg, in a sentence: real import customs outside
// the customs union, a Union status check at an EU port.
const formalityName = (leg) => (leg.formality === 'union_status' ? 'port formalities' : 'customs')

// "Zaragoza to Drammen, via Tarragona and customs at Oslo": the intermediate
// ports and customs stops, read from the legs. A port with a customs stop is
// named once, by the stop.
export function routeSentence(view) {
  const stops = []
  view.legs.forEach((leg, index) => {
    const last = index === view.legs.length - 1
    if (leg.mode === 'customs') {
      const at = stops.indexOf(leg.from)
      if (at !== -1) stops.splice(at, 1)
      stops.push(`${formalityName(leg)} at ${leg.from}`)
    } else if (!last && leg.toKind === 'port') {
      const city = leg.to.replace(/ port$/, '')
      if (city !== view.destination.city && !stops.includes(city)) stops.push(city)
    }
  })
  return stops.length ? `${routeShort(view)}, via ${joinList(stops)}` : routeShort(view)
}

// The heading of a leg on the timeline. A customs leg says which formality it
// is, so an EU port check never reads as import clearance.
export function legTitle(leg) {
  if (leg.mode === 'customs') {
    return leg.formality === 'union_status'
      ? `Port formalities at ${leg.from} (Union status check)`
      : `Import customs at ${leg.from}`
  }
  return `${MODE_LABELS[leg.mode]}, ${leg.from} to ${leg.to}`
}

// "Road", "Sea" or "Road + sea": the transport modes of a shipment. Customs is
// a stop, not a mode of transport, so it is left out.
export function modeSummary(view) {
  const modes = [...new Set(view.legs.map((leg) => leg.mode).filter((mode) => mode !== 'customs'))]
  const words = modes.map((mode) => mode.charAt(0).toUpperCase() + mode.slice(1))
  return words.map((word, i) => (i === 0 ? word : word.toLowerCase())).join(' + ')
}
