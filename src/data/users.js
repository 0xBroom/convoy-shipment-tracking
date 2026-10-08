// Two fixed personas. The ops perimeter is every shipment whose origin or
// destination site is in `sites`.
export const USERS = {
  customer: {
    id: 'user-customer',
    role: 'customer',
    name: 'Nordvik Subsidiary',
    customerId: 'nordvik',
  },
  ops: {
    id: 'user-ops',
    role: 'ops',
    name: 'Ops, Zaragoza and Tarragona',
    sites: ['zaragoza', 'tarragona'],
  },
}
