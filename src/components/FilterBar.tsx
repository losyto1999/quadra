import { Info } from 'lucide-react'
import { useId } from 'react'
import { CURRENT_YEAR, CURRENT_YEAR_PARTIAL, FIRST_YEAR, isPeriodAvailable, periodLabel, PERIODS, YEARS } from '../data/calendar'
import { translate as t } from '../i18n/locale'
import { useQuadraFilters } from '../useQuadraFilters'

/** Un valore arrivato dall'URL può essere qualsiasi testo: nell'avviso se ne mostra solo l'inizio. */
const shorten = (value: string) => (value.length > 24 ? `${value.slice(0, 24)}…` : value)

/** Anno e periodo, condivisi da tutte le pagine; a destra il periodo con cui si confronta. */
export function FilterBar() {
    const { filters, period, invalid, setYear, setPeriod, acceptFallback } = useQuadraFilters()
    const yearId = useId()
    const hintId = useId()

    return (
        <section aria-label={t('filters.label')} className="flex flex-col gap-3 rounded-bar bg-surface px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-2.5 small:w-full">
                    <label htmlFor={yearId} className="text-label font-semibold text-muted">
                        {t('filters.year')}
                    </label>
                    <select
                        id={yearId}
                        className="quadra-select select-chevron h-11 cursor-pointer appearance-none rounded-control bg-chip pr-10 pl-3.5 text-sm font-semibold text-ink small:min-w-0 small:flex-1"
                        value={filters.year}
                        onChange={(e) => setYear(Number(e.target.value))}
                    >
                        {YEARS.map((year) => (
                            <option key={year} value={year}>
                                {year === CURRENT_YEAR && CURRENT_YEAR_PARTIAL ? t('filters.yearToDate', { year }) : year}
                            </option>
                        ))}
                    </select>
                </div>

                <div role="group" aria-label={t('filters.period')} className="flex flex-wrap gap-1.5 small:grid small:w-full small:grid-cols-3">
                    {PERIODS.map((p) => {
                        const available = isPeriodAvailable(filters.year, p.key)
                        return (
                            <button
                                key={p.key}
                                type="button"
                                className="h-11 cursor-pointer rounded-control bg-chip px-4 text-sm font-semibold text-ink enabled:not-aria-pressed:hover:bg-track disabled:cursor-not-allowed disabled:text-muted disabled:opacity-60 aria-pressed:bg-accent aria-pressed:text-white small:px-1"
                                aria-pressed={filters.period === p.key}
                                disabled={!available}
                                aria-describedby={available ? undefined : hintId}
                                title={available ? undefined : t(`filters.notStarted.${p.key}`, { year: filters.year })}
                                onClick={() => setPeriod(p.key)}
                            >
                                {periodLabel(p.key)}
                            </button>
                        )
                    })}
                    <span id={hintId} className="sr-only">
                        {t('filters.hint')}
                    </span>
                </div>

                <p className="ml-auto text-label text-muted compact:ml-0 compact:w-full small:text-center" aria-live="polite">
                    {t('filters.compare', { label: period.compareLabel })}
                </p>
            </div>

            {/* Filtri non validi nel link (anno senza dati, periodo sconosciuto): si mostra il default e lo si dice. */}
            {invalid && (
                <div role="status" className="flex items-center gap-x-2.5 gap-y-1 rounded-alert bg-alert-info px-3.5 py-2 text-sm small:flex-wrap">
                    <Info className="size-4 shrink-0 text-accent" aria-hidden="true" strokeWidth={2.25} />
                    <p className="min-w-0 flex-1">
                        {invalid.field === 'year'
                            ? t('filters.invalid.year', {
                                  value: shorten(invalid.value),
                                  from: FIRST_YEAR,
                                  to: CURRENT_YEAR,
                                  year: filters.year,
                              })
                            : t('filters.invalid.period', { value: shorten(invalid.value), year: filters.year })}
                    </p>
                    <button
                        type="button"
                        onClick={acceptFallback}
                        className="min-h-9 cursor-pointer rounded-control px-3 text-sm font-semibold text-accent hover:bg-surface small:ml-auto"
                    >
                        {t('filters.invalid.dismiss')}
                    </button>
                </div>
            )}
        </section>
    )
}
