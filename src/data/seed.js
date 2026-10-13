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
    title: 'Order 12345 import declaration lodged at Oslo',
    text: 'Fjordklar Customs received the import declaration for Oslo on 13 Oct at 10:00. We still have to send the commercial invoice before Norwegian customs can clear the goods.',
    sentAt: t(13, '11:05'),
    read: false,
  },
  {
    id: 'notice-12210-seed',
    shipmentId: '12210',
    customerId: 'nordvik',
    kind: 'delivered',
    title: 'Order 12210 delivered',
    text: 'Delivered to Drammen at 09:12. Signed by the receiving warehouse.',
    sentAt: t(13, '09:12'),
    read: false,
  },
  {
    id: 'notice-12411-seed',
    shipmentId: '12411',
    customerId: 'nordvik',
    kind: 'update',
    title: 'Order 12411 loaded at Tarragona',
    text: 'Loaded on the Oslo sailing at Tarragona on 12 Oct at 11:00. Fjordklar Customs will handle import clearance at Oslo.',
    sentAt: t(12, '11:30'),
    read: true,
  },
  // Vistula's notice: the Nordvik persona never sees it, but the ops activity
  // log on 12290 says an update went out, so the notice has to exist.
  {
    id: 'notice-12290-seed',
    shipmentId: '12290',
    customerId: 'vistula',
    kind: 'customs',
    title: 'Order 12290 held at Gdansk pending proof of Union status',
    text: 'The port could not confirm Union status for the goods and rejected the T2L. Convoy is sending a corrected proof of Union status to Baltic Customs.',
    sentAt: t(12, '16:40'),
    read: true,
  },
]

// Ops activity log entries present when the demo loads (newest first at
// render). Each one names its channel, as the reducer does at runtime, which
// numbers its own entries "activity-1" upwards; the seed ids stay out of
// that sequence.
export const SEED_ACTIVITY = [
  { id: 'seed-activity-1', at: t(13, '11:05'), type: 'notice', shipmentId: '12345', text: 'Update sent to customer, Convoy inbox and email' },
  { id: 'seed-activity-2', at: t(13, '10:20'), type: 'operator', shipmentId: '12418', text: 'Message sent to Iberroute by email' },
  { id: 'seed-activity-3', at: t(12, '16:55'), type: 'operator', shipmentId: '12290', text: 'Message sent to Baltic Customs by email' },
  { id: 'seed-activity-4', at: t(12, '16:45'), type: 'notice', shipmentId: '12290', text: 'Update sent to customer, Convoy inbox and email' },
  { id: 'seed-activity-5', at: t(12, '11:30'), type: 'notice', shipmentId: '12411', text: 'Update sent to customer, Convoy inbox and email' },
]
