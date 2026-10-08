import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { fmtDateTime } from '../../lib/format.js'
import { markNoticesRead } from '../../store/actions.js'
import { selectCustomerNotices } from '../../store/selectors.js'
import { useDispatch, useSelector } from '../../store/useStore.js'
import './Notifications.css'

// Opening the page marks everything read, so the nav count drops at once.
// The dots shown here are the ones that were unread when the page opened,
// so the customer can still see what is new.
export default function Notifications() {
  const dispatch = useDispatch()
  const notices = useSelector(selectCustomerNotices)
  const unreadIds = notices.filter((n) => !n.read).map((n) => n.id)
  const [wasUnread] = useState(() => new Set(unreadIds))
  const unreadKey = unreadIds.join()

  useEffect(() => {
    document.title = 'Notifications, Convoy'
  }, [])

  useEffect(() => {
    if (unreadKey) dispatch(markNoticesRead(unreadKey.split(',')))
  }, [unreadKey, dispatch])

  return (
    <div className="notices">
      <h1>Notifications</h1>

      {notices.length === 0 ? (
        <p className="notices-empty">No notifications. We tell you here when a shipment changes.</p>
      ) : (
        <ul className="notices-list">
          {notices.map((notice) => {
            const unread = !notice.read || wasUnread.has(notice.id)
            return (
              <li className="notice" key={notice.id} data-unread={unread}>
                <span className="notice-dot" aria-hidden="true" />
                <div className="notice-main">
                  <h2>
                    {unread && <span className="visually-hidden">Unread. </span>}
                    {notice.title}
                  </h2>
                  <p className="notice-body">{notice.text}</p>
                  <Link to={`/customer/shipments/${notice.shipmentId}`}>
                    Open shipment<span className="visually-hidden"> {notice.shipmentId}</span>
                  </Link>
                </div>
                <time className="notice-time" dateTime={notice.sentAt}>
                  {fmtDateTime(notice.sentAt)}
                </time>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
