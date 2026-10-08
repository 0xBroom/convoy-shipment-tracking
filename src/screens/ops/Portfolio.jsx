import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { rankByRisk } from '../../ai/risk.js'
import { parseQuery } from '../../ai/search.js'
import Estimate from '../../components/Estimate.jsx'
import RiskLevel from '../../components/RiskLevel.jsx'
import SearchBar from '../../components/SearchBar.jsx'
import StatusSwatch from '../../components/StatusSwatch.jsx'
import { CUSTOMERS_BY_ID } from '../../data/customers.js'
import { COUNTRIES, SITES_BY_ID } from '../../data/sites.js'
import { USERS } from '../../data/users.js'
import {
  RISK_OPTIONS,
  STATUS_OPTIONS,
  WINDOW_OPTIONS,
  applyFilters,
  countActive,
  emptyFilters,
} from '../../lib/filters.js'
import { fmtDateTime } from '../../lib/format.js'
import { modeSummary, routeShort } from '../../lib/route.js'
import { lastEvent } from '../../lib/shipment.js'
import { selectPerimeterViews } from '../../store/selectors.js'
import { useSelector } from '../../store/useStore.js'
import './Portfolio.css'

// What a search string means: the filter object, the interpretation shown
// under the search bar, and whether nothing at all was understood.
function interpret(q) {
  if (!q) return { filters: emptyFilters(), interpreted: null, unreadable: false }
  const parsed = parseQuery(q)
  if (!parsed.filters) return { filters: emptyFilters(), interpreted: null, unreadable: true }
  return { filters: parsed.filters, interpreted: { chips: parsed.chips, ignored: parsed.ignored }, unreadable: false }
}

const initial = (q) => ({ q, text: q ?? '', ...interpret(q) })

const uniqueBy = (items, key) => [...new Map(items.map((item) => [key(item), item])).values()]

// The dropdown options come from the shipments this role can see, so a site,
// country or customer that only the hidden shipment has is never offered. A
// shipment can touch the perimeter at one end only, so sites are kept to the
// ops user's own.
function optionsOf(views) {
  const sites = uniqueBy(
    views.flatMap((v) => [v.origin, v.destination]).filter((p) => USERS.ops.sites.includes(p.siteId)),
    (p) => p.siteId,
  )
    .map((p) => ({ value: p.siteId, label: SITES_BY_ID[p.siteId].name }))
    .sort((a, b) => a.label.localeCompare(b.label))
  const countries = [...new Set(views.map((v) => v.destination.country))]
    .map((code) => ({ value: code, label: COUNTRIES[code] }))
    .sort((a, b) => a.label.localeCompare(b.label))
  const customers = [...new Set(views.map((v) => v.customerId))]
    .map((id) => ({ value: id, label: CUSTOMERS_BY_ID[id].name }))
    .sort((a, b) => a.label.localeCompare(b.label))
  return { sites, countries, customers }
}

function FilterSelect({ id, label, value, options, onChange }) {
  return (
    <div className="portfolio-filter">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="field" value={value ?? ''} onChange={(event) => onChange(event.target.value || null)}>
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function Portfolio() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q')
  const views = useSelector(selectPerimeterViews)
  const [state, setState] = useState(() => initial(q))

  // The URL is the source of a search: when ?q= changes from outside (a link
  // from Today, the nav), rebuild the filters from it during render.
  if (state.q !== q) setState(initial(q))

  useEffect(() => {
    document.title = 'Portfolio, Convoy'
  }, [])

  const { filters, interpreted, unreadable } = state
  const options = useMemo(() => optionsOf(views), [views])
  const rows = useMemo(() => rankByRisk(applyFilters(views, filters)), [views, filters])
  const active = countActive(filters)

  function search(text) {
    const result = interpret(text)
    if (result.unreadable) {
      // Nothing understood: say so and leave the table as it is.
      setState((current) => ({ ...current, unreadable: true }))
      return
    }
    setState({ q: text, text, ...result })
    setParams({ q: text })
  }

  // Dropdowns and chips edit the same filter object; a control that changes a
  // filter takes its chip away.
  function setFilter(key, value) {
    setState((current) => {
      const chips = current.interpreted?.chips.filter((chip) => chip.key !== key) ?? []
      return {
        ...current,
        unreadable: false,
        filters: { ...current.filters, [key]: value },
        interpreted: chips.length ? { ...current.interpreted, chips } : null,
      }
    })
  }

  function clear() {
    setState({ q: null, text: '', ...interpret(null) })
    setParams({})
  }

  return (
    <div className="portfolio">
      <header className="portfolio-head">
        <h1>Portfolio</h1>
        <p className="portfolio-count" aria-live="polite">
          {rows.length} of {views.length} shipments
        </p>
      </header>

      <SearchBar
        text={state.text}
        onTextChange={(text) => setState((current) => ({ ...current, text }))}
        interpreted={interpreted}
        unreadable={unreadable}
        onSearch={search}
        onRemoveChip={(key) => setFilter(key, null)}
      />

      <section className="portfolio-filters" aria-label="Filters">
        <FilterSelect id="f-status" label="Status" value={filters.status} options={STATUS_OPTIONS} onChange={(v) => setFilter('status', v)} />
        <FilterSelect id="f-site" label="Site" value={filters.siteId} options={options.sites} onChange={(v) => setFilter('siteId', v)} />
        <FilterSelect id="f-country" label="Destination country" value={filters.destinationCountry} options={options.countries} onChange={(v) => setFilter('destinationCountry', v)} />
        <FilterSelect id="f-customer" label="Customer" value={filters.customerId} options={options.customers} onChange={(v) => setFilter('customerId', v)} />
        <FilterSelect id="f-risk" label="Risk" value={filters.risk} options={RISK_OPTIONS} onChange={(v) => setFilter('risk', v)} />
        <FilterSelect id="f-window" label="Window" value={filters.window} options={WINDOW_OPTIONS} onChange={(v) => setFilter('window', v)} />
      </section>

      {active > 0 && (
        <p className="portfolio-active">
          <span>
            {active} {active === 1 ? 'filter' : 'filters'} active
          </span>
          <button type="button" className="portfolio-clear" onClick={clear}>
            Clear filters
          </button>
        </p>
      )}

      {rows.length === 0 ? (
        <div className="portfolio-empty">
          <p>No shipments match these filters.</p>
          <button type="button" className="button button-secondary" onClick={clear}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="portfolio-table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col">Route</th>
                <th scope="col">Mode</th>
                <th scope="col">Status</th>
                <th scope="col">Risk</th>
                <th scope="col">Arrival</th>
                <th scope="col">Last update</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((view) => (
                <tr key={view.id} data-level={view.risk.level}>
                  <td className="portfolio-order">
                    <Link to={`/ops/shipments/${view.id}`}>{view.id}</Link>
                  </td>
                  <td className="portfolio-customer">{view.customerName}</td>
                  <td className="portfolio-route">{routeShort(view)}</td>
                  <td className="portfolio-mode">{modeSummary(view)}</td>
                  <td className="portfolio-status">
                    <StatusSwatch view={view} />
                  </td>
                  <td className="portfolio-risk">
                    <RiskLevel level={view.risk.level} />
                  </td>
                  <td className="portfolio-arrival">
                    <Estimate view={view} variant="cell" />
                  </td>
                  <td className="portfolio-updated">
                    <time dateTime={lastEvent(view).at.toISOString()}>{fmtDateTime(lastEvent(view).at)}</time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
