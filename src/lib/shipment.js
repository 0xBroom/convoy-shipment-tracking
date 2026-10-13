// Small readers over a shipment view (facts plus `timeline`, the normalised
// events in time order). Kept here so the AI engines and screens agree on
// what "delivered" and "current leg" mean.

export const lastEvent = (view) => view.timeline.at(-1) ?? null

// Delivery is confirmed only by a delivered milestone on the final leg. An
// earlier leg's "Delivered" (for example a drop at the port) is not delivery.
export function deliveredEvent(view) {
  const finalLeg = view.legs.length - 1
  return view.timeline.findLast((e) => e.milestone === 'delivered' && e.legIndex === finalLeg) ?? null
}

export const isDelivered = (view) => deliveredEvent(view) !== null

// The latest customs event, if it is a hold that has not been cleared since.
export function openHold(view) {
  const customs = view.timeline.filter((e) => view.legs[e.legIndex]?.mode === 'customs')
  const latest = customs.at(-1)
  return latest?.milestone === 'held' ? latest : null
}

// The one wording for an open hold, shared by the risk reasons and the
// proposed actions. At an EU port the goods are held because their Union
// status is unproven, not by import customs.
export function holdText(view, hold = openHold(view)) {
  const leg = view.legs[hold.legIndex]
  return leg?.formality === 'union_status'
    ? `Held pending proof of Union status, ${hold.location}`
    : `Held at customs, ${hold.location}`
}

// Who to ask: the broker when the shipment is held, otherwise the operator of
// the last status.
export function contactTarget(view) {
  const hold = openHold(view)
  const last = hold ?? lastEvent(view)
  return last
    ? { operatorId: last.operatorId, operatorName: last.operatorName, event: last }
    : null
}

export const placeOf = (view) => view.destination.city

// The moment a shipment arrives or is expected to: confirmed delivery, then
// an operator ETA or the moved estimate, then the plan. Used for ordering,
// never for display (display goes through <Estimate>).
export function arrivalAt(view) {
  const delivered = deliveredEvent(view)
  if (delivered) return new Date(delivered.at)
  if (view.estimate?.moved || view.estimate?.confirmed) return view.estimate.value
  return new Date(view.legs.at(-1).plannedArrival)
}
