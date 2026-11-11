import { translate } from '../i18n/locale'
import { monthShort } from '../utils/format'

/** Indice assoluto di un mese (anno × 12 + mese), comodo per intervalli e ritardi. */
export const monthIndex = (year: number, month: number) => year * 12 + month
export const yearOf = (index: number) => Math.floor(index / 12)
export const monthOf = (index: number) => ((index % 12) + 12) % 12

/** Mese in corso in ora italiana (l'azienda è in Italia, chi guarda la dashboard forse no). */
function currentMonthInItaly() {
    const [year, month] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date()).split('-')
    return monthIndex(Number(year), Number(month) - 1)
}

/**
 * Ultimo mese con dati, unica fonte del calendario: il mese prima di quello in corso, che non è ancora
 * chiuso. Da qui derivano anno corrente, mesi trascorsi, testi di confronto e l'intervallo dei dati mock,
 * che restano così coerenti con la data di oggi: lo stesso mese dà sempre gli stessi numeri. A gennaio
 * l'anno dei dati è quello appena chiuso, completo.
 */
export const LAST_CLOSED_MONTH = currentMonthInItaly() - 1

export const CURRENT_YEAR = yearOf(LAST_CLOSED_MONTH)
/** Mesi chiusi dell'anno corrente (10 = gen–ott). */
export const CLOSED_MONTHS = monthOf(LAST_CLOSED_MONTH) + 1
/** L'anno corrente non è ancora finito: il suo "anno intero" è "da inizio anno". */
export const CURRENT_YEAR_PARTIAL = CLOSED_MONTHS < 12

/** Anni selezionabili, dal più recente. */
export const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3]
export const FIRST_YEAR = YEARS[YEARS.length - 1]
/** Anno generato solo come termine di confronto del primo anno selezionabile: non si mostra mai da solo. */
export const BASELINE_YEAR = FIRST_YEAR - 1

/** Tre mesi di avviamento prima dell'anno base, solo per avere crediti e incassi realistici a inizio dati. */
export const FIRST_GENERATED_MONTH = monthIndex(BASELINE_YEAR, 0) - 3

/** Ultimo giorno del mese (indice assoluto). */
export const endOfMonth = (index: number) => new Date(yearOf(index), monthOf(index) + 1, 0)

export type PeriodKey = 'full' | 'h1' | 'h2'

export interface QuadraFilters {
    year: number
    period: PeriodKey
}

export const PERIODS: { key: PeriodKey; months: number[] }[] = [
    { key: 'full', months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
    { key: 'h1', months: [0, 1, 2, 3, 4, 5] },
    { key: 'h2', months: [6, 7, 8, 9, 10, 11] },
]

/** "Anno intero", "1° semestre", "2° semestre", nella lingua attiva. */
export const periodLabel = (key: PeriodKey) => translate(`periods.${key}`)

export const DEFAULT_FILTERS: QuadraFilters = { year: CURRENT_YEAR, period: 'full' }

export const isPeriodKey = (value: string | null): value is PeriodKey => PERIODS.some((p) => p.key === value)

const periodDef = (key: PeriodKey) => PERIODS.find((p) => p.key === key) ?? PERIODS[0]

/** Tutti i mesi (0–11) del periodo, anche quelli non ancora chiusi: l'asse dei grafici mensili. */
export const periodMonths = (key: PeriodKey) => periodDef(key).months

/** Mesi (0–11) del periodo che hanno dati: per l'anno corrente solo quelli già chiusi. */
export function closedMonthsOf(year: number, period: PeriodKey) {
    const months = periodDef(period).months
    return year === CURRENT_YEAR ? months.filter((m) => m < CLOSED_MONTHS) : months
}

/** Un periodo si può scegliere solo se ha almeno un mese chiuso (il 2° semestre dell'anno corrente, prima che luglio sia chiuso, no). */
export function isPeriodAvailable(year: number, period: PeriodKey) {
    return YEARS.includes(year) && closedMonthsOf(year, period).length > 0
}

/** "gen–set 2026", "lug 2026". I mesi di un periodo sono sempre consecutivi. */
export function monthRangeLabel(months: number[], year: number) {
    const first = monthShort(months[0])
    const last = monthShort(months[months.length - 1])
    return months.length === 1 ? `${first} ${year}` : `${first}–${last} ${year}`
}

/** Il filtro tradotto in mesi, confronto, date dei saldi ed etichette: l'unico punto che applica le regole. */
export interface ResolvedPeriod {
    year: number
    period: PeriodKey
    /** Mesi 0–11 con dati. */
    months: number[]
    /** Gli stessi mesi in indice assoluto, e quelli dell'anno prima. */
    range: number[]
    compareRange: number[]
    compareYear: number
    /** Anno corrente con il periodo non ancora finito. */
    partial: boolean
    /** "gen–set 2026" e "gen–set 2025". */
    label: string
    compareLabel: string
    /** "da inizio anno", "2024", "1° semestre 2025". */
    title: string
    /** Fine dell'ultimo mese con dati: la data a cui si leggono liquidità, crediti, DSO e DPO. */
    snapshotMonth: number
    compareSnapshotMonth: number
    snapshot: Date
    compareSnapshot: Date
    /** Lo snapshot è l'ultimo mese chiuso in assoluto ("Liquidità attuale"). */
    latest: boolean
}

export function resolvePeriod({ year, period }: QuadraFilters): ResolvedPeriod {
    const months = closedMonthsOf(year, period)
    const compareYear = year - 1
    const range = months.map((m) => monthIndex(year, m))
    const compareRange = months.map((m) => monthIndex(compareYear, m))
    const snapshotMonth = range[range.length - 1]
    const compareSnapshotMonth = compareRange[compareRange.length - 1]
    const isYearToDate = year === CURRENT_YEAR && period === 'full' && CURRENT_YEAR_PARTIAL
    const title = isYearToDate
        ? translate('periods.yearToDate')
        : period === 'full'
          ? String(year)
          : `${periodLabel(period).toLocaleLowerCase()} ${year}`

    return {
        year,
        period,
        months,
        range,
        compareRange,
        compareYear,
        partial: months.length < periodDef(period).months.length,
        label: monthRangeLabel(months, year),
        compareLabel: monthRangeLabel(months, compareYear),
        title,
        snapshotMonth,
        compareSnapshotMonth,
        snapshot: endOfMonth(snapshotMonth),
        compareSnapshot: endOfMonth(compareSnapshotMonth),
        latest: snapshotMonth === LAST_CLOSED_MONTH,
    }
}
