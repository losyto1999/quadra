import { useTranslation } from 'react-i18next'
import type { Lang } from '../i18n/locale'
import { useLocale } from '../i18n/locale'
import { cx } from '../utils/cx'

const LANGS: Lang[] = ['it', 'en']

/** Selettore IT/EN a pillole, come la nav: la scelta resta salvata nel browser (vedi i18n/index.ts). */
export function LanguageSwitch() {
    const { t, i18n } = useTranslation()
    const { lang } = useLocale()

    function choose(next: Lang) {
        if (next === lang) return
        i18n.changeLanguage(next)
    }

    return (
        <div role="group" aria-label={t('header.language')} className="flex shrink-0 gap-0.5 rounded-full bg-surface p-[5px]">
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
    )
}
