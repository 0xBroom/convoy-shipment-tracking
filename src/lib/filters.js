// Shape shared by the dropdowns, the chips and the natural-language parser.
// `order` is parser-only (shown as a chip, no dropdown). applyFilters and
// countActive arrive with the portfolio screen.
export const FILTER_KEYS = ['status', 'siteId', 'destinationCountry', 'customerId', 'risk', 'window', 'order']

export const emptyFilters = () => Object.fromEntries(FILTER_KEYS.map((key) => [key, null]))
