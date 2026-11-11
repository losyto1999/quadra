import { CircleAlert, RotateCw } from 'lucide-react'
import { useId } from 'react'
import { InvalidFiltersError } from '../api/dashboard'
import { translate as t } from '../i18n/locale'

/** Al posto della pagina quando l'API rifiuta: cosa è successo e un pulsante per riprovare. */
export function LoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
    const titleId = useId()
    const message = error instanceof InvalidFiltersError ? t('errors.invalidFilters') : t('errors.unavailable')

    return (
        <section
            role="alert"
            aria-labelledby={titleId}
            className="flex items-center gap-4 rounded-card bg-surface p-6 small:flex-col small:items-start small:gap-3"
        >
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-alert-red text-negative" aria-hidden="true">
                <CircleAlert className="size-5" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-base leading-[1.3] font-bold">
                    {t('errors.title')}
                </h2>
                <p className="text-sm text-muted">{message}</p>
            </div>
            <button
                type="button"
                onClick={onRetry}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-control bg-accent px-4 text-sm font-semibold text-white hover:bg-ink"
            >
                <RotateCw className="size-4" aria-hidden="true" strokeWidth={2.25} />
                {t('errors.retry')}
            </button>
        </section>
    )
}
