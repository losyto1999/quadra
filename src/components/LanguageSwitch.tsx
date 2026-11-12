import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Lang } from '../i18n/locale'
import { useLocale } from '../i18n/locale'
import { cx } from '../utils/cx'

const LANGS: Lang[] = ['it', 'en']
const LANG_NAMES: Record<Lang, string> = { it: 'Italiano', en: 'English' }

/**
 * Selettore IT/EN a pillole, come la nav: la scelta resta salvata nel browser (vedi i18n/index.ts).
 * Sotto i 640px diventa un solo tasto che mostra la lingua a cui si passa, per lasciare spazio al resto dell'header.
 */
export function LanguageSwitch() {
    const { t, i18n } = useTranslation()
    const { lang } = useLocale()
    const other = LANGS.find((l) => l !== lang) ?? 'it'

    function choose(next: Lang) {
        if (next === lang) return
        i18n.changeLanguage(next)
    }

    return (
        <>
            <div role="group" aria-label={t('header.language')} className="flex shrink-0 gap-0.5 rounded-full bg-surface p-[5px] small:hidden">
                {LANGS.map((l) => (
                    <button
                        key={l}
                        type="button"
                        lang={l}
                        aria-pressed={lang === l}
                        onClick={() => choose(l)}
                        className={cx(
                            'inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full px-3 text-sm font-bold uppercase transition-colors',
                            lang === l ? 'bg-ink text-white' : 'text-muted hover:bg-chip hover:text-ink',
                        )}
                    >
                        {l}
                    </button>
                ))}
            </div>
            <button
                type="button"
                lang={other}
                aria-label={t('header.switchTo', { lang: LANG_NAMES[other] })}
                onClick={() => choose(other)}
                className="hidden min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-surface px-4 text-sm font-bold text-ink uppercase small:inline-flex"
            >
                <Globe aria-hidden="true" className="size-4" />
                {other}
            </button>
        </>
    )
}
