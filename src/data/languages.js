// The languages Convoy drafts in. A customer's account language and the
// language an operator posts its statuses in both come from this list; the
// UI itself stays in English.
export const LANGUAGES = { en: 'English', fr: 'French' }

// English is the shared language of the trade: the only fallback offered when
// a draft is in the recipient's own language. There is no switch the other
// way, since with many languages Convoy could not know which one to offer.
export const FALLBACK_LANGUAGE = 'en'
