import { translate } from '../i18n/locale'
import { monthLong, monthShort } from '../utils/format'
import { endOfMonth, FIRST_GENERATED_MONTH, LAST_CLOSED_MONTH, monthOf, yearOf } from './calendar'
import { AREAS, CLIENTS, COST_CATEGORIES, LINES } from './company'
import type { AreaId, CostCategoryId, LineId } from './company'
import { generateDataset } from './generate'
import { AGING_BUCKETS, TOP_CLIENTS } from './rules'
import type { AgingBucketId, Forecast, ForecastMonth, Invoice, MonthCash, MonthOverheads, RawForecastMonth, SaleRow } from './types'

// Aggregazioni pure sul dataset di base. Ogni pagina usa queste stesse funzioni con lo stesso periodo,
// quindi i totali coincidono per costruzione (Panoramica = pagine di dettaglio).
// `range` è un elenco di mesi in indice assoluto (vedi calendar.ts).

const DATA = generateDataset()

const DAY = 86_400_000
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

export function salesIn(range: number[]): SaleRow[] {
    return range.flatMap((m) => DATA.salesByMonth.get(m) ?? [])
}

/** Il mese ha dati (generati e già chiusi). */
export const hasData = (month: number) => month >= FIRST_GENERATED_MONTH && month <= LAST_CLOSED_MONTH

export function revenueOf(range: number[]) {
    return sum(salesIn(range).map((r) => r.revenue))
}

/** Fatturato di un mese, null se il mese non ha (ancora) dati. */
export function monthRevenue(month: number) {
    return hasData(month) ? revenueOf([month]) : null
}

export function directCostOf(range: number[]) {
    return sum(salesIn(range).map((r) => r.directCost))
}

export function revenueByLine(range: number[]) {
    const totals = Object.fromEntries(LINES.map((l) => [l.id, 0])) as Record<LineId, number>
    for (const row of salesIn(range)) totals[row.line] += row.revenue
    return totals
}

export function directCostByLine(range: number[]) {
    const totals = Object.fromEntries(LINES.map((l) => [l.id, 0])) as Record<LineId, number>
    for (const row of salesIn(range)) totals[row.line] += row.directCost
    return totals
}

export function revenueByArea(range: number[]) {
    const totals = Object.fromEntries(AREAS.map((a) => [a.id, 0])) as Record<AreaId, number>
    for (const row of salesIn(range)) totals[CLIENTS[row.clientId].area] += row.revenue
    return totals
}

export interface ClientStats {
    id: number
    revenue: number
    directCost: number
    orders: number
}

/** Clienti con fatturato nel periodo, dal più grande. */
export function clientStats(range: number[]): ClientStats[] {
    const stats = new Map<number, ClientStats>()
    for (const row of salesIn(range)) {
        let s = stats.get(row.clientId)
        if (!s) {
            s = { id: row.clientId, revenue: 0, directCost: 0, orders: 0 }
            stats.set(row.clientId, s)
        }
        s.revenue += row.revenue
        s.directCost += row.directCost
        s.orders += row.orders
    }
    return [...stats.values()].sort((a, b) => b.revenue - a.revenue)
}

export function activeClientsOf(range: number[]) {
    return clientStats(range).length
}

/** Quota dei ricavi dei primi clienti del periodo (TOP_CLIENTS, i primi tre). */
export function top3ShareOf(range: number[]) {
    const stats = clientStats(range)
    const total = sum(stats.map((s) => s.revenue))
    return total ? sum(stats.slice(0, TOP_CLIENTS).map((s) => s.revenue)) / total : 0
}

/** Ultima fattura del cliente nel periodo. */
export function lastInvoiceOf(clientId: number, range: number[]) {
    const months = new Set(range)
    let last: Invoice | undefined
    for (const invoice of DATA.invoices) {
        if (invoice.clientId === clientId && months.has(invoice.month)) last = invoice
    }
    return last?.issued ?? null
}

export function overheadsOf(range: number[]): MonthOverheads {
    const total: MonthOverheads = { indirectLabor: 0, structure: 0, logistics: 0, marketing: 0 }
    for (const m of range) {
        const o = DATA.overheads.get(m)
        if (!o) continue
        total.indirectLabor += o.indirectLabor
        total.structure += o.structure
        total.logistics += o.logistics
        total.marketing += o.marketing
    }
    return total
}

/** Costi per categoria: il personale somma manodopera diretta e personale indiretto. */
export function costsByCategory(range: number[]) {
    const rows = salesIn(range)
    const o = overheadsOf(range)
    const totals: Record<CostCategoryId, number> = {
        personale: sum(rows.map((r) => r.labor)) + o.indirectLabor,
        materie: sum(rows.map((r) => r.materials)),
        struttura: o.structure,
        logistica: o.logistics,
        marketing: o.marketing,
    }
    return totals
}

export function totalCostsOf(range: number[]) {
    const byCategory = costsByCategory(range)
    return sum(COST_CATEGORIES.map((c) => byCategory[c.id]))
}

/** Margine lordo % = (fatturato − costi diretti) / fatturato. */
export function grossMarginOf(range: number[]) {
    const revenue = revenueOf(range)
    return revenue ? (revenue - directCostOf(range)) / revenue : 0
}

export function ebitdaOf(range: number[]) {
    return revenueOf(range) - totalCostsOf(range)
}

/** Incidenza del personale sul fatturato. */
export function personnelRatioOf(range: number[]) {
    const revenue = revenueOf(range)
    return revenue ? costsByCategory(range).personale / revenue : 0
}

// --- Cassa ---------------------------------------------------------------------------------------

export function cashOf(month: number): MonthCash {
    return DATA.cash.get(month) ?? { inflow: 0, outflow: 0, balance: 0 }
}

/** Liquidità a fine mese. */
export function balanceAt(month: number) {
    return cashOf(month).balance
}

const labelled = (m: RawForecastMonth): ForecastMonth => ({
    ...m,
    label: monthShort(monthOf(m.month)),
    name: monthLong(monthOf(m.month)),
    longLabel: `${monthLong(monthOf(m.month))} ${yearOf(m.month)}`,
})

/** La previsione di liquidità, con i nomi dei mesi nella lingua attiva (il dataset è uguale in tutte). */
export function forecast(): Forecast {
    const { months, min, threshold } = DATA.forecast
    const first = months[0].month
    const last = months[months.length - 1].month
    return {
        months: months.map(labelled),
        min: labelled(min),
        threshold,
        rangeLabel: `${monthShort(monthOf(first))} ${yearOf(first)} – ${monthShort(monthOf(last))} ${yearOf(last)}`,
    }
}

/** Fatture emesse entro fine mese e non ancora incassate a quella data. */
function openInvoicesAt(month: number) {
    const end = endOfMonth(month).getTime()
    return DATA.invoices.filter((i) => i.month <= month && (i.paid === null || i.paid.getTime() > end))
}

export function receivablesAt(month: number) {
    return sum(openInvoicesAt(month).map((i) => i.amount))
}

/** "0–30 giorni"… "Oltre 90 giorni", nella lingua attiva, ricavata dai limiti delle fasce. */
export function bucketLabel(id: AgingBucketId) {
    const i = AGING_BUCKETS.findIndex((b) => b.id === id)
    const from = i > 0 ? AGING_BUCKETS[i - 1].max : 0
    const { max } = AGING_BUCKETS[i]
    return Number.isFinite(max)
        ? translate('aging.range', { from: i > 0 ? from + 1 : 0, to: max })
        : translate('aging.over', { days: from })
}

export const bucketOf = (daysLate: number) =>
    (AGING_BUCKETS.find((b) => daysLate <= b.max) ?? AGING_BUCKETS[AGING_BUCKETS.length - 1]).id

export interface OverdueInvoice extends Invoice {
    daysLate: number
    bucket: AgingBucketId
}

/** Fatture scadute e non incassate a fine mese, dalla più in ritardo. */
export function overdueAt(month: number): OverdueInvoice[] {
    const end = endOfMonth(month)
    return openInvoicesAt(month)
        .filter((i) => i.due.getTime() < end.getTime())
        .map((i) => {
            const daysLate = Math.round((end.getTime() - i.due.getTime()) / DAY)
            return { ...i, daysLate, bucket: bucketOf(daysLate) }
        })
        .sort((a, b) => b.daysLate - a.daysLate || b.amount - a.amount)
}

export function overdueTotalAt(month: number) {
    return sum(overdueAt(month).map((i) => i.amount))
}

const last12 = (month: number) => Array.from({ length: 12 }, (_, i) => month - 11 + i)

/** DSO a fine mese: crediti / fatturato degli ultimi 12 mesi × 365. */
export function dsoAt(month: number) {
    const revenue = revenueOf(last12(month))
    return revenue ? (receivablesAt(month) / revenue) * 365 : 0
}

/** DPO a fine mese: debiti verso fornitori / acquisti degli ultimi 12 mesi × 365. */
export function dpoAt(month: number) {
    const range = last12(month)
    const o = overheadsOf(range)
    const purchases = costsByCategory(range).materie + o.structure + o.logistics + o.marketing
    return purchases ? ((DATA.payables.get(month) ?? 0) / purchases) * 365 : 0
}

export const clientName = (id: number) => CLIENTS[id].name
