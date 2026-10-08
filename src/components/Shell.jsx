import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { USERS } from '../data/users.js'
import { ROLE_HOME, ROLE_LABELS, roleOfPath } from '../lib/roles.js'
import { switchRole } from '../store/actions.js'
import { selectExceptions, selectUnreadCount } from '../store/selectors.js'
import { useDispatch, useSelector, useStore } from '../store/useStore.js'
import DemoControls from './DemoControls.jsx'
import './Shell.css'
import Toasts from './Toast.jsx'
import Wordmark from './Wordmark.jsx'

const ROLES = ['customer', 'ops']

export default function Shell() {
  const { state } = useStore()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const role = state.role
  const urlRole = roleOfPath(pathname)
  const radios = useRef({})

  const unread = useSelector(selectUnreadCount)
  const openExceptions = useSelector((s) => (s.role === 'ops' ? selectExceptions(s).rows.length : 0))

  // The URL decides the role, so a reload or a deep link to /ops/... lands in
  // Ops. Choosing a role in the switcher only navigates; this effect then
  // dispatches switchRole. The other role's screens are never rendered.
  useEffect(() => {
    if (urlRole && urlRole !== role) dispatch(switchRole(urlRole))
  }, [urlRole, role, dispatch])

  const choose = (next) => {
    if (next !== role) navigate(ROLE_HOME[next])
  }

  const onRadioKeyDown = (event, index) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
    if (!step) return
    event.preventDefault()
    const next = ROLES[(index + step + ROLES.length) % ROLES.length]
    choose(next)
    radios.current[next]?.focus()
  }

  const synced = !urlRole || urlRole === role

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="shell-bar">
        <div className="shell-bar-inner" data-role={role}>
          <Link to="/" className="shell-brand" aria-label="Convoy home">
            <Wordmark />
          </Link>

          <nav className="shell-nav" aria-label="Primary">
            {role === 'customer' ? (
              <>
                <NavLink to="/customer/shipments">My shipments</NavLink>
                <NavLink to="/customer/notifications">
                  Notifications
                  {unread > 0 && (
                    <span className="shell-count">
                      {unread}
                      <span className="visually-hidden"> unread</span>
                    </span>
                  )}
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/ops/today">Today</NavLink>
                <NavLink to="/ops/exceptions">
                  Exceptions
                  {openExceptions > 0 && (
                    <span className="shell-count">
                      {openExceptions}
                      <span className="visually-hidden"> open</span>
                    </span>
                  )}
                </NavLink>
                <NavLink to="/ops/shipments">Portfolio</NavLink>
              </>
            )}
          </nav>

          <div className="shell-tools">
            <DemoControls />
            <div className="shell-viewer">
              <span className="shell-viewer-label" id="viewing-as">
                Viewing as
              </span>
              <div className="role-switch" role="radiogroup" aria-labelledby="viewing-as">
                {ROLES.map((id, index) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={role === id}
                    tabIndex={role === id ? 0 : -1}
                    ref={(node) => {
                      radios.current[id] = node
                    }}
                    onClick={() => choose(id)}
                    onKeyDown={(event) => onRadioKeyDown(event, index)}
                  >
                    {ROLE_LABELS[id]}
                  </button>
                ))}
              </div>
              <p className="shell-persona">{USERS[role].name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="shell-main" id="main" tabIndex={-1} data-role={role}>
        {synced ? <Outlet /> : null}
      </main>
      <Toasts />
    </>
  )
}
