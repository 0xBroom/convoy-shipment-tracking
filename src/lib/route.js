// "Zaragoza to Gdansk": the short form used in lists.
export const routeShort = (view) => `${view.origin.city} to ${view.destination.city}`

const joinList = (items) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`

// "Zaragoza to Gdansk, via Tarragona and customs at Gdansk": the intermediate
// ports and customs stops, read from the legs.
export function routeSentence(view) {
  const stops = []
  view.legs.forEach((leg, index) => {
    const last = index === view.legs.length - 1
    if (leg.mode === 'customs') stops.push(`customs at ${leg.from}`)
    else if (!last && leg.toKind === 'port') {
      const city = leg.to.replace(/ port$/, '')
      if (city !== view.destination.city && !stops.includes(city)) stops.push(city)
    }
  })
  return stops.length ? `${routeShort(view)}, via ${joinList(stops)}` : routeShort(view)
}
