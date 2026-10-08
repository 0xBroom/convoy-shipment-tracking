import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import { describeAction } from '../../ai/summary.js'
import ActionButtons, { ActionButton, ActionStates } from '../../components/ActionButtons.jsx'
import AiStamp, { Why } from '../../components/AiStamp.jsx'
import ReasonTags from '../../components/ReasonTags.jsx'
import RiskLevel from '../../components/RiskLevel.jsx'
import { NOW } from '../../data/now.js'
import { OPERATORS_BY_ID } from '../../data/operators.js'
import { CATEGORIES } from '../../lib/categories.js'
import { routeShort } from '../../lib/route.js'
import { categoryOf, selectExceptions } from '../../store/selectors.js'
import { useSelector } from '../../store/useStore.js'
import './Exceptions.css'

// The first action still worth taking: a delivered notice does not need to be
// proposed again, and "awaiting" is a wait, not a task.
function proposedAction(view) {
  const open = view.risk.actions.find((a) => !(a.type === 'notify' && view.notified))
  const action = open ?? view.risk.actions[0]
  return action ? describeAction(view, action, NOW).text : 'Review the latest operator status'
}

export default function Exceptions() {
  const [params] = useSearchParams()
  const requested = params.get('category')
  const category = requested in CATEGORIES ? requested : null
  const { rows, groups } = useSelector((state) => selectExceptions(state, category))

  useEffect(() => {
    document.title = 'Exceptions, Convoy'
  }, [])

  // Incident groups follow the same category filter as the table.
  const shownGroups = groups
    .map((group) => ({ ...group, members: category ? group.members.filter((v) => categoryOf(v) === category) : group.members }))
    .filter((group) => group.members.length > 0)

  return (
    <div className="exceptions">
      <header className="exceptions-head">
        <h1>Exceptions</h1>
        <p className="exceptions-count">
          {rows.length} open, ranked by risk
          {category && (
            <>
              . Showing {CATEGORIES[category].toLowerCase()}. <Link to="/ops/exceptions">Show all</Link>
            </>
          )}
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="exceptions-empty">The queue is clear. New exceptions appear here as they happen.</p>
      ) : (
        <>
          {shownGroups.map(({ incident, members }) => (
            <section className="incident" key={incident.id} aria-labelledby={`incident-${incident.id}`}>
              <div className="incident-head">
                <h2 id={`incident-${incident.id}`}>{incident.title}</h2>
                <AiStamp variant="suggests" />
              </div>
              <p>{incident.summary}</p>
              <Why>
                {OPERATORS_BY_ID[incident.operatorId].name} posted '{incident.raw}' on{' '}
                {members.length} shipments loaded at Tarragona.
              </Why>
              <ul className="incident-members">
                {members.map((view) => (
                  <li key={view.id}>
                    <Link className="incident-order" to={`/ops/shipments/${view.id}`}>
                      {view.id}
                    </Link>
                    <span className="incident-customer">{view.customerName}</span>
                    <ActionButton view={view} action={{ type: 'notify' }} />
                    <ActionStates view={view} />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <div className="table-scroll">
            <table className="exceptions-table">
              <thead>
                <tr>
                  <th scope="col" className="num">
                    Rank
                  </th>
                  <th scope="col">Order</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Risk</th>
                  <th scope="col">Reasons</th>
                  <th scope="col">Proposed action</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((view, index) => (
                  <tr key={view.id} data-level={view.risk.level}>
                    <td className="num exceptions-rank">{index + 1}</td>
                    <td className="exceptions-order">
                      <div className="exceptions-order-cell">
                        <Link to={`/ops/shipments/${view.id}`}>{view.id}</Link>
                        <span className="exceptions-route">{routeShort(view)}</span>
                      </div>
                    </td>
                    <td className="exceptions-customer">{view.customerName}</td>
                    <td>
                      <RiskLevel level={view.risk.level} />
                    </td>
                    <td>
                      <ReasonTags tags={view.risk.tags} />
                    </td>
                    <td className="exceptions-proposed">{proposedAction(view)}</td>
                    <td>
                      <div className="exceptions-actions">
                        <ActionButtons view={view} emphasis />
                        <ActionStates view={view} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
