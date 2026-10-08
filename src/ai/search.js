import { COUNTRIES, SITES } from '../data/sites.js'
import { CUSTOMERS } from '../data/customers.js'
import { emptyFilters } from '../lib/filters.js'

// Canned natural-language search. A fixed, ordered rule table maps phrases to
// the same filter object the dropdowns edit. Matched text is removed as it is
// consumed; whatever is left over is reported as ignored instead of guessed.
// The input is only ever matched against static patterns: never evaluated.

// Words that only name the thing being searched; consuming them is not a claim.
const FILLER = new Set(['shipments', 'shipment', 'orders', 'show', 'find', 'list'])

export const SUGGESTED_QUERIES = [
  'shipments to France this week running late',
  'held at customs',
  'stale from Tarragona',
  'missing document',
]

const countryRules = Object.entries(COUNTRIES).map(([code, name]) => ({
  test: new RegExp(`\\b${name.toLowerCase()}\\b`, 'g'),
  key: 'destinationCountry',
  value: code,
  label: `Destination: ${name}`,
}))

const siteRules = SITES.map((site) => ({
  test: new RegExp(`\\b(?:from\\s+)?${site.city.toLowerCase()}\\b`, 'g'),
  key: 'siteId',
  value: site.id,
  label: `Site: ${site.name}`,
}))

const customerRules = CUSTOMERS.map((customer) => ({
  test: new RegExp(`\\b${customer.name.toLowerCase().split(' ')[0]}(?:\\s+${customer.name.toLowerCase().split(' ').slice(1).join('\\s+')})?\\b`, 'g'),
  key: 'customerId',
  value: customer.id,
  label: `Customer: ${customer.name}`,
}))

const RULES = [
  // order number, with or without the word "order" or a hash
  { test: /\b(?:order\s*)?#?(\d{5})\b/g, key: 'order', value: (m) => m[1], label: (m) => `Order: ${m[1]}` },
  ...countryRules,
  ...siteRules,
  { test: /\bthis week\b/g, key: 'window', value: 'this_week', label: 'Window: this week' },
  { test: /\btoday\b/g, key: 'window', value: 'today', label: 'Window: today' },
  { test: /\b(?:running late|late|delayed|behind)\b/g, key: 'status', value: 'delayed', label: 'Status: delayed' },
  {
    test: /\b(?:held(?: at)? customs|customs hold|held|customs|hold)\b/g,
    key: 'status',
    value: 'customs_hold',
    label: 'Status: held at customs',
  },
  { test: /\b(?:stale|no update|silent)\b/g, key: 'status', value: 'stale', label: 'Status: stale' },
  {
    test: /\b(?:missing documents?|missing docs?|documents?|paperwork)\b/g,
    key: 'status',
    value: 'missing_doc',
    label: 'Status: missing document',
  },
  { test: /\bdelivered\b/g, key: 'status', value: 'delivered', label: 'Status: delivered' },
  { test: /\b(?:at risk|risky)\b/g, key: 'risk', value: 'medium', label: 'Risk: medium or high' },
  ...customerRules,
]

// Returns { filters, chips, ignored }. `filters` is null when nothing matched,
// so the screen can show the "could not read" fallback and leave rows alone.
export function parseQuery(text) {
  let rest = text.toLowerCase()
  const filters = emptyFilters()
  const chips = []

  for (const rule of RULES) {
    const matches = [...rest.matchAll(rule.test)]
    if (!matches.length || filters[rule.key] !== null) continue
    const first = matches[0]
    filters[rule.key] = typeof rule.value === 'function' ? rule.value(first) : rule.value
    chips.push({ key: rule.key, label: typeof rule.label === 'function' ? rule.label(first) : rule.label })
    rest = rest.replace(rule.test, ' ')
  }

  const ignored = [...new Set(rest.match(/[a-z0-9']+/g) ?? [])].filter(
    (word) => word.length > 3 && !FILLER.has(word),
  )

  return { filters: chips.length ? filters : null, chips, ignored }
}
