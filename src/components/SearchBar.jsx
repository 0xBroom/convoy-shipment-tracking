import { Search, X } from 'lucide-react'
import { useId, useRef } from 'react'
import { SUGGESTED_QUERIES } from '../ai/search.js'
import AiStamp, { Why } from './AiStamp.jsx'
import './SearchBar.css'

/*
  Natural-language search over the portfolio. It only reports what the parser
  understood: the interpreted filters as removable chips, and the words it did
  not use as "Ignored". When nothing was understood it says so and offers the
  suggested queries instead of guessing.

  `text` and `onTextChange` control the input; `interpreted` is { chips, ignored } or null; `unreadable` is true after a
  search that matched nothing. The parent decides what a search does. `onClear` puts the page back as it was before
  any search: the × inside the field shows as soon as there is anything to clear.
*/
export default function SearchBar({ text, onTextChange, interpreted, unreadable, onSearch, onRemoveChip, onClear }) {
  const inputId = useId()
  const input = useRef(null)
  const clearable = Boolean(text || interpreted || unreadable)

  function clear() {
    onClear()
    input.current?.focus()
  }

  function submit(event) {
    event.preventDefault()
    if (text.trim()) onSearch(text.trim())
  }

  function suggest(query) {
    onTextChange(query)
    onSearch(query)
  }

  return (
    <section className="search panel" aria-label="Search">
      <form className="search-form" role="search" onSubmit={submit}>
        <label className="visually-hidden" htmlFor={inputId}>
          Search shipments
        </label>
        <span className="search-field">
          <Search className="search-icon" size={18} aria-hidden="true" />
          <input
            id={inputId}
            ref={input}
            className="field search-input"
            type="search"
            value={text}
            placeholder="Try: shipments to France this week running late"
            onChange={(event) => onTextChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && clearable) clear()
            }}
            autoComplete="off"
          />
          {clearable && (
            <button type="button" className="search-clear" onClick={clear} aria-label="Clear search and filters">
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </span>
        <button type="submit" className="button">
          Search
        </button>
      </form>

      <div className="search-suggestions">
        <p role={unreadable ? 'status' : undefined}>
          {unreadable ? 'Convoy could not read that search. Try one of these:' : 'Try:'}
        </p>
        <ul>
          {SUGGESTED_QUERIES.map((query) => (
            <li key={query}>
              <button type="button" className="button button-secondary" onClick={() => suggest(query)}>
                {query}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {interpreted && (
        <div className="search-interpreted">
          <p className="search-interpreted-head">
            <span>Interpreted from your search</span>
            <AiStamp variant="interpreted" />
          </p>
          {interpreted.chips.length > 0 && (
            <ul className="search-chips" aria-label="Interpreted filters">
              {interpreted.chips.map((chip) => (
                <li key={chip.key}>
                  <button
                    type="button"
                    className="search-chip"
                    onClick={() => onRemoveChip(chip.key)}
                    aria-label={`Remove filter ${chip.label}`}
                  >
                    {chip.label}
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {interpreted.ignored.length > 0 && <p className="search-ignored">Ignored: {interpreted.ignored.join(', ')}</p>}
          <Why>Convoy matched fixed phrases for places, dates, statuses and customers. It lists what it did not use.</Why>
        </div>
      )}
    </section>
  )
}
