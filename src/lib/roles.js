// Where each role lands, and which role a URL belongs to.
export const ROLE_HOME = { customer: '/customer/shipments', ops: '/ops/today' }

export const ROLE_LABELS = { customer: 'Customer', ops: 'Ops' }

// "/ops/shipments/12345" -> "ops"; paths without a role prefix -> null.
export function roleOfPath(pathname) {
  const [first] = pathname.split('/').filter(Boolean)
  return first === 'customer' || first === 'ops' ? first : null
}
