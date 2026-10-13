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
    text: 'Customs documents for Gdansk were lodged on 13 Oct at 10:00. We still have to send the commercial invoice before customs review.',
    sentAt: t(13, '11:05'),
    read: false,
  },
  {
    id: 'notice-12210-seed',
    shipmentId: '12210',
    customerId: 'nordvik',
    kind: 'delivered',
    title: 'Order 12210 delivered',
    text: 'Delivered to Lyon at 09:12. Signed by the receiving warehouse.',
    sentAt: t(13, '09:12'),
    read: false,
  },
  {
    id: 'notice-12290-seed',
    shipmentId: '12290',
    customerId: 'nordvik',
    kind: 'customs',
    title: 'Order 12290 held at customs at Gdansk',
    text: 'Customs asked for a corrected declaration. Convoy is following up with the broker.',
    sentAt: t(12, '16:40'),
    read: true,
  },
]

// Ops activity log entries present when the demo loads (newest first at
// render). Each one names its channel, as the reducer does at runtime.
export const SEED_ACTIVITY = [
  { id: 'activity-1', at: t(13, '11:05'), type: 'notice', shipmentId: '12345', text: 'Update sent to customer, Convoy inbox and email' },
  { id: 'activity-2', at: t(13, '10:20'), type: 'operator', shipmentId: '12418', text: 'Message sent to Iberroute by email' },
  { id: 'activity-3', at: t(12, '16:55'), type: 'operator', shipmentId: '12290', text: 'Message sent to Baltic Customs by email' },
  { id: 'activity-4', at: t(12, '16:45'), type: 'notice', shipmentId: '12290', text: 'Update sent to customer, Convoy inbox and email' },
]
