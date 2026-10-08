import { t } from './time.js'

// Customer-facing notices present when the demo loads. Ops "Send notice"
// actions append to this list at runtime. `kind: 'delay'` is what marks a
// shipment as "Customer notified" in the exceptions queue; these seed notices
// are other kinds so the demo's own notice for 12345 still has work to do.
export const SEED_NOTICES = [
  {
    id: 'notice-12345-seed',
    shipmentId: '12345',
    customerId: 'nordvik',
    kind: 'update',
    title: 'Order 12345 customs documents lodged',
    text: 'Customs documents for Gdansk were lodged on 8 Oct at 10:00. We still need the commercial invoice before customs review.',
    sentAt: t(8, '11:05'),
    read: false,
  },
  {
    id: 'notice-12210-seed',
    shipmentId: '12210',
    customerId: 'nordvik',
    kind: 'delivered',
    title: 'Order 12210 delivered',
    text: 'Delivered to Lyon at 09:12. Signed by the receiving warehouse.',
    sentAt: t(8, '09:12'),
    read: false,
  },
  {
    id: 'notice-12290-seed',
    shipmentId: '12290',
    customerId: 'nordvik',
    kind: 'customs',
    title: 'Order 12290 held at customs at Gdansk',
    text: 'Customs asked for a corrected declaration. Convoy is following up with the broker.',
    sentAt: t(7, '16:40'),
    read: true,
  },
]

// Ops activity log entries present when the demo loads (newest first at render).
export const SEED_ACTIVITY = [
  { id: 'activity-1', at: t(8, '11:05'), type: 'notice', shipmentId: '12345', text: 'Update sent to customer' },
  { id: 'activity-2', at: t(8, '10:20'), type: 'operator', shipmentId: '12418', text: 'Message sent to Iberroute' },
  { id: 'activity-3', at: t(7, '16:55'), type: 'operator', shipmentId: '12290', text: 'Message sent to Baltic Customs' },
  { id: 'activity-4', at: t(7, '16:45'), type: 'notice', shipmentId: '12290', text: 'Update sent to customer' },
]
