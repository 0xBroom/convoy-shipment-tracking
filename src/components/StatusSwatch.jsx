import { deriveStatus } from '../lib/status.js'
import './StatusSwatch.css'

// The status word in a pill tinted by its tone. The colour only flags; the
// word is what carries the meaning.
export default function StatusSwatch({ view }) {
  const status = deriveStatus(view)
  return (
    <span className="swatch" data-tone={status.tone}>
      <span className="swatch-square" aria-hidden="true" />
      {status.label}
    </span>
  )
}
