import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en.json'
import it from '../locales/it.json'

// Lingua: `?lng=en` / `?lng=it` nell'URL, poi la scelta salvata dal selettore nell'header,
// infine quella del browser (italiano come ripiego).
i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: { it: { quadra: it }, en: { quadra: en } },
        ns: ['quadra'],
        defaultNS: 'quadra',
        supportedLngs: ['it', 'en'],
        nonExplicitSupportedLngs: true,
        fallbackLng: 'it',
        interpolation: { escapeValue: false },
        detection: {
            order: ['querystring', 'localStorage', 'navigator'],
            lookupQuerystring: 'lng',
            lookupLocalStorage: 'quadra:lang',
            caches: ['localStorage'],
        },
    })

const syncHtmlLang = (lng: string) => {
    document.documentElement.lang = lng.slice(0, 2)
}
syncHtmlLang(i18n.resolvedLanguage ?? 'it')
i18n.on('languageChanged', syncHtmlLang)

export default i18n
