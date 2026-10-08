export const COUNTRIES = {
  ES: 'Spain',
  FR: 'France',
  PL: 'Poland',
  PT: 'Portugal',
  IT: 'Italy',
}

// The four company sites. The ops user covers zaragoza and tarragona.
export const SITES = [
  { id: 'zaragoza', name: 'Zaragoza plant', city: 'Zaragoza', country: 'ES' },
  { id: 'tarragona', name: 'Tarragona warehouse', city: 'Tarragona', country: 'ES' },
  { id: 'lyon', name: 'Lyon', city: 'Lyon', country: 'FR' },
  { id: 'gdansk', name: 'Gdansk', city: 'Gdansk', country: 'PL' },
]

export const SITES_BY_ID = Object.fromEntries(SITES.map((site) => [site.id, site]))
