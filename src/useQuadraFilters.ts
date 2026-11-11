import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { InvalidFiltersError } from './api/dashboard'
import { DEFAULT_FILTERS, isPeriodAvailable, isPeriodKey, resolvePeriod, YEARS } from './data/calendar'
import type { PeriodKey, QuadraFilters } from './data/calendar'
import { useLocale } from './i18n/locale'

// I filtri vivono nella query string (?anno=2026&periodo=full|h1|h2): valgono per tutte le pagine,
// sopravvivono al ricaricamento e al tasto indietro e si possono condividere con un link. Senza
// parametri valgono i default (anno corrente, anno intero). Un valore non valido (anno senza dati,
// periodo sconosciuto o senza mesi chiusi) ricade sul default e viene segnalato con un
// InvalidFiltersError, che la barra dei filtri mostra finché non si sceglie un filtro.

const PARAMS = { year: 'anno', period: 'periodo' } as const

function readFilters(params: URLSearchParams) {
    let invalid: InvalidFiltersError | null = null

    let year = DEFAULT_FILTERS.year
    const rawYear = params.get(PARAMS.year)
    if (rawYear !== null) {
        if (YEARS.includes(Number(rawYear))) year = Number(rawYear)
        else invalid = new InvalidFiltersError('year', rawYear)
    }

    let period = DEFAULT_FILTERS.period
    const rawPeriod = params.get(PARAMS.period)
    if (rawPeriod !== null) {
        if (isPeriodKey(rawPeriod) && isPeriodAvailable(year, rawPeriod)) period = rawPeriod
        else invalid ??= new InvalidFiltersError('period', rawPeriod)
    }

    const filters: QuadraFilters = { year, period }
    return { filters, invalid }
}

export function useQuadraFilters() {
    const [params, setParams] = useSearchParams()
    const { filters, invalid } = useMemo(() => readFilters(params), [params])
    // I testi del periodo ("gen–ott 2026") sono nella lingua attiva: si ricalcolano a ogni render (costa
    // poco), e useLocale fa ri-renderizzare chi usa questo hook quando la lingua cambia.
    useLocale()
    const period = resolvePeriod(filters)

    // Si parte dall'URL attuale e non da `params`: react-router aggiorna la pagina in una
    // transizione, e con due scritture ravvicinate la seconda cancellerebbe la prima.
    function update(next: QuadraFilters) {
        const search = new URLSearchParams(window.location.search)
        search.set(PARAMS.year, String(next.year))
        search.set(PARAMS.period, next.period)
        setParams(search, { replace: true })
    }

    function setYear(year: number) {
        update({ year, period: isPeriodAvailable(year, filters.period) ? filters.period : DEFAULT_FILTERS.period })
    }

    function setPeriod(next: PeriodKey) {
        update({ year: filters.year, period: next })
    }

    /** Sostituisce nell'URL i valori non validi con quelli mostrati: l'avviso sparisce. */
    function acceptFallback() {
        update(filters)
    }

    return { filters, period, invalid, setYear, setPeriod, acceptFallback }
}

/**
 * Query string per i link tra le pagine: solo i filtri. Un `?lng=` dell'URL d'ingresso non si
 * ripropaga, altrimenti dopo una scelta dal selettore di lingua tornerebbe a vincere al ricaricamento.
 */
export function useFilterSearch() {
    const [params] = useSearchParams()
    return useMemo(() => {
        const search = new URLSearchParams()
        for (const key of Object.values(PARAMS)) {
            const value = params.get(key)
            if (value !== null) search.set(key, value)
        }
        const text = search.toString()
        return text ? `?${text}` : ''
    }, [params])
}
