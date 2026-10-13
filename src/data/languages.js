// The languages Convoy drafts in. A customer's account language and the
// language an operator posts its statuses in both come from this list; the
// UI itself stays in English.
export const LANGUAGES = { en: 'English', fr: 'French' }

// The other one, for the "Write in … instead" switch.
export const otherLanguage = (code) => (code === 'fr' ? 'en' : 'fr')
