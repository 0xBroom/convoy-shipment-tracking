import { deriveStatus } from '../lib/status.js'
import './StatusSwatch.css'

// An 8px square in the status colour followed by the status word. The colour
// only flags; the word is what carries the meaning.
export default function StatusSwatch({ view }) {
  const status = deriveStatus(view)
  return (
    <span className="swatch" data-tone={status.tone}>
      <span className="swatch-square" aria-hidden="true" />
      {status.label}
    </span>
  )
}
