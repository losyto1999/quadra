import i18n from 'i18next'
import { useTranslation } from 'react-i18next'

// Lingua attiva e helper per i testi. La lingua si può cambiare in qualsiasi momento dal
// selettore nell'header: niente testi o formattatori calcolati una volta sola a livello di
// modulo, si legge sempre la lingua al momento della chiamata.

export type Lang = 'it' | 'en'

/** Locale per `Intl`: italiano o inglese britannico (stesso ordine giorno-mese, 24 ore). */
const LOCALES: Record<Lang, string> = { it: 'it-IT', en: 'en-GB' }

/** Lingua attiva, ridotta a it/en (`i18n.language` può essere anche `en-US`). */
export const currentLang = (): Lang => (i18n.resolvedLanguage === 'en' ? 'en' : 'it')

/** Locale `Intl` della lingua attiva. */
export const currentLocale = () => LOCALES[currentLang()]

/**
 * Testo nella lingua attiva al momento della chiamata. Serve anche fuori dai componenti (dati,
 * descrizioni dei grafici): i componenti che lo usano si ri-renderizzano al cambio di lingua
 * perché layout e pagine leggono `useLocale()`.
 */
export const translate = (key: string, options?: Record<string, unknown>) =>
    i18n.getFixedT(currentLang())(key, options)

/** Elenco con la congiunzione della lingua ("a, b e c" / "a, b and c"). */
export const formatList = (items: string[]) =>
    new Intl.ListFormat(currentLocale(), { type: 'conjunction' }).format(items)

/** Lingua attiva e locale `Intl` per i componenti: si ri-renderizzano se la lingua cambia. */
export function useLocale() {
    const { i18n: instance } = useTranslation()
    const lang: Lang = instance.resolvedLanguage === 'en' ? 'en' : 'it'
    return { lang, locale: LOCALES[lang] }
}
