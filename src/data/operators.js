// Six operators, two per mode. Each one speaks its own raw vocabulary; that
// is the point of the normaliser. `vocab` maps raw status to a milestone.
// `email` is where Convoy writes to them; the addresses are made up.
export const OPERATORS = [
  {
    id: 'iberroute',
    name: 'Iberroute',
    mode: 'road',
    email: 'ops@iberroute.example',
    vocab: {
      Tendered: 'picked_up',
      'Depot scan': 'departed_hub',
      'In transit': 'in_transit',
      OUT_FOR_DELIVERY: 'out_for_delivery',
      POD: 'delivered',
    },
  },
  {
    id: 'nordhaul',
    name: 'Nordhaul',
    mode: 'road',
    email: 'ops@nordhaul.example',
    vocab: {
      Collected: 'picked_up',
      Linehaul: 'in_transit',
      'With driver': 'out_for_delivery',
      Delivered: 'delivered',
    },
  },
  {
    id: 'portline',
    name: 'Portline',
    mode: 'sea',
    email: 'ops@portline.example',
    vocab: {
      'Gate-in': 'gate_in',
      'Loaded on vessel': 'loaded',
      Departed: 'departed',
      Arrived: 'arrived',
      Discharged: 'discharged',
      'Gate-out': 'gate_out',
    },
  },
  {
    id: 'medlines',
    name: 'MedLines',
    mode: 'sea',
    email: 'ops@medlines.example',
    vocab: {
      'GATE IN': 'gate_in',
      'VSL LOAD': 'loaded',
      'VSL DEP': 'departed',
      'VSL ARR': 'arrived',
      DISCH: 'discharged',
      'GATE OUT': 'gate_out',
    },
  },
  {
    id: 'baltic-customs',
    name: 'Baltic Customs',
    mode: 'customs',
    email: 'docs@baltic-customs.example',
    vocab: {
      'Docs lodged': 'docs_submitted',
      'Under review': 'under_review',
      'Held for inspection': 'held',
      Released: 'cleared',
    },
  },
  {
    id: 'rhone-brokers',
    name: 'Rhone Brokers',
    mode: 'customs',
    email: 'docs@rhone-brokers.example',
    vocab: {
      'Déclaration déposée': 'docs_submitted',
      Contrôle: 'under_review',
      Bloqué: 'held',
      Dédouané: 'cleared',
    },
  },
]

export const OPERATORS_BY_ID = Object.fromEntries(OPERATORS.map((op) => [op.id, op]))
