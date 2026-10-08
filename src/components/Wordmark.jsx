import './Wordmark.css'

// Hand-rolled mark: three offset boxes, a convoy. The word is real text.
export default function Wordmark() {
  return (
    <span className="wordmark">
      <svg className="wordmark-mark" viewBox="0 0 32 32" width="24" height="24" aria-hidden="true" focusable="false">
        <rect x="17" y="4" width="12" height="11" fill="var(--ink-2)" stroke="var(--surface)" strokeWidth="1.5" />
        <rect x="9.5" y="10.5" width="12" height="11" fill="var(--harbour)" stroke="var(--surface)" strokeWidth="1.5" />
        <rect x="3" y="17" width="12" height="11" fill="var(--ink)" stroke="var(--surface)" strokeWidth="1.5" />
      </svg>
      <span className="wordmark-text">Convoy</span>
    </span>
  )
}
