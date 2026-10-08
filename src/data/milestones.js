// Canonical milestones per transport mode. Every operator's raw status maps
// onto one of these (see operators.js); anything else becomes 'unknown'.
export const MILESTONES = {
  road: ['picked_up', 'departed_hub', 'in_transit', 'out_for_delivery', 'delivered'],
  sea: ['gate_in', 'loaded', 'departed', 'arrived', 'discharged', 'gate_out'],
  customs: ['docs_submitted', 'under_review', 'held', 'cleared'],
}

export const MILESTONE_LABELS = {
  picked_up: 'Picked up',
  departed_hub: 'Departed hub',
  in_transit: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  gate_in: 'Gate-in port',
  loaded: 'Loaded on vessel',
  departed: 'Departed',
  arrived: 'Arrived',
  discharged: 'Discharged',
  gate_out: 'Gate-out',
  docs_submitted: 'Docs submitted',
  under_review: 'Under review',
  held: 'Held',
  cleared: 'Cleared',
  unknown: 'Not mapped',
}

export const MODE_LABELS = { road: 'Road', sea: 'Sea', customs: 'Customs' }
