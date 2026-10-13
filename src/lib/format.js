import { TZ } from '../data/now.js'

// All formatting goes through Intl with a fixed locale and time zone, so the
// demo renders identically on any machine.
const dateTime = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: TZ,
})
const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: TZ })
const time = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: TZ,
})
const timeSeconds = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZone: TZ,
})
const dayKeyFormat = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: TZ,
})

const HOUR = 3_600_000

// "8 Oct, 14:30". The comma is forced so output does not depend on ICU version.
export function fmtDateTime(value) {
  const parts = dateTime.formatToParts(new Date(value))
  const pick = (type) => parts.find((p) => p.type === type).value
  return `${pick('day')} ${pick('month')}, ${pick('hour')}:${pick('minute')}`
}

// "8 Oct"
export const fmtDate = (value) => date.format(new Date(value))

// "14:30"
export const fmtTime = (value) => time.format(new Date(value))

// "14:30:12", for moments seconds apart: the live feed's event times.
export const fmtTimeSeconds = (value) => timeSeconds.format(new Date(value))

// "2026-10-08", the calendar day in the demo time zone.
export const dayKey = (value) => dayKeyFormat.format(new Date(value))

export const hoursBetween = (from, to) => (new Date(to) - new Date(from)) / HOUR

export const hoursSince = (value, now) => hoursBetween(value, now)

// "6 h" under a day, then whole days ("1 day", "2 days").
export function fmtDuration(hours) {
  if (hours < 24) return `${Math.round(hours)} h`
  const days = Math.floor(hours / 24)
  return days === 1 ? '1 day' : `${days} days`
}

// "31 h ago", "2 days ago", "in 3 h", "in 1 day".
export function fmtRelative(value, now) {
  const hours = hoursBetween(now, value)
  const text = fmtDuration(Math.abs(hours))
  return hours < 0 ? `${text} ago` : `in ${text}`
}

// "Thursday 8 October". Built from parts so the output does not depend on the
// ICU version's comma rules.
const longDate = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: TZ,
})

export function fmtLongDate(value) {
  const parts = longDate.formatToParts(new Date(value))
  const pick = (type) => parts.find((p) => p.type === type).value
  return `${pick('weekday')} ${pick('day')} ${pick('month')}`
}
