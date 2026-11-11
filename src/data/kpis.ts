import { translate } from '../i18n/locale'
import { sections } from '../routes'
import type { PageKey, SectionId } from '../routes'
import { TOP_CLIENTS } from './rules'
import type { DeltaKind, Polarity, ValueFormat } from './types'

// Ogni metrica dichiara qui formato, modo di esprimere la variazione, polarità (un aumento è
// favorevole o no) e la sezione che la approfondisce.

export type KpiId =
    | 'revenue'
    | 'activeClients'
    | 'avgRevenue'
    | 'top3Share'
    | 'totalCosts'
    | 'grossMargin'
    | 'ebitda'
    | 'personnelRatio'
    | 'liquidity'
    | 'dso'
    | 'dpo'
    | 'overdue'

export interface KpiDef {
    format: ValueFormat
    delta: DeltaKind
    polarity: Polarity
    page: Exclude<PageKey, 'overview'>
    section: SectionId
}

const REVENUE = { page: 'revenue' } as const
const COSTS = { page: 'costs' } as const
const CASH = { page: 'cash' } as const

/** Nome della metrica nella lingua attiva (locales/*.json, `kpis.<id>`). */
export const kpiLabel = (id: KpiId) => translate(`kpis.${id}`, { n: TOP_CLIENTS })

/** Nome di una pagina ("Ricavi"): voce di menu e destinazione delle KPI per i lettori di schermo. */
export const pageName = (page: PageKey) => translate(`pages.${page}`)

export const KPI_DEFS: Record<KpiId, KpiDef> = {
    revenue: { format: 'euro', delta: 'relative', polarity: 'up-good', ...REVENUE, section: sections.revenueMonthly },
    activeClients: { format: 'count', delta: 'count', polarity: 'up-good', ...REVENUE, section: sections.topClients },
    avgRevenue: { format: 'euro', delta: 'relative', polarity: 'up-good', ...REVENUE, section: sections.topClients },
    top3Share: { format: 'percent', delta: 'points', polarity: 'up-bad', ...REVENUE, section: sections.topClients },
    totalCosts: { format: 'euro', delta: 'relative', polarity: 'up-bad', ...COSTS, section: sections.costsByCategory },
    grossMargin: { format: 'percent', delta: 'points', polarity: 'up-good', ...COSTS, section: sections.lineMargins },
    ebitda: { format: 'euro', delta: 'relative', polarity: 'up-good', ...COSTS, section: sections.costsByCategory },
    personnelRatio: { format: 'percent', delta: 'points', polarity: 'up-bad', ...COSTS, section: sections.costsComposition },
    liquidity: { format: 'euro', delta: 'relative', polarity: 'up-good', ...CASH, section: sections.cashForecast },
    dso: { format: 'days', delta: 'days', polarity: 'up-bad', ...CASH, section: sections.aging },
    dpo: { format: 'days', delta: 'days', polarity: 'up-good', ...CASH, section: sections.cashFlows },
    overdue: { format: 'euro', delta: 'relative', polarity: 'up-bad', ...CASH, section: sections.overdueInvoices },
}

/** Variazione nel modo della metrica; null se non c'è un confronto sensato. */
export function computeDelta(kind: DeltaKind, value: number, previous: number | null) {
    if (previous === null) return null
    if (kind === 'relative') return previous === 0 ? null : (value - previous) / Math.abs(previous)
    if (kind === 'days') return Math.round(value) - Math.round(previous)
    return value - previous
}
