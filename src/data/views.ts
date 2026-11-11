import { translate as t } from '../i18n/locale'
import { formatDate, formatPercent, monthShort } from '../utils/format'
import * as agg from './aggregate'
import { bucketLabel } from './aggregate'
import { monthIndex, periodMonths, resolvePeriod, YEARS } from './calendar'
import type { QuadraFilters, ResolvedPeriod } from './calendar'
import { AREAS, areaLabel, categoryLabel, CLIENTS, COST_CATEGORIES, LINES, lineLabel, SUMMER_CLOSURE_MONTH } from './company'
import type { CostCategoryId } from './company'
import { costAlerts, overviewAlerts, overviewInsight } from './insights'
import type { PeriodFacts } from './insights'
import { AGING_BUCKETS, CLIENT_MARGIN_FLOOR, SERIOUS_OVERDUE_DAYS, TOP_CLIENTS, TOP_CLIENTS_TABLE } from './rules'
import type {
    Breakdown,
    CashData,
    CostsData,
    LineMarginRow,
    MonthPoint,
    OverviewData,
    RevenueData,
    Slice,
} from './types'

// I dati di ogni pagina, costruiti per il periodo scelto con le funzioni di aggregate.ts.
// È la parte che un'API reale farebbe lato server: api/dashboard.ts la avvolge in una Promise.

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

function breakdown<Id extends string>(items: { id: Id; label: string; value: number }[]): Breakdown<Id> {
    const total = sum(items.map((i) => i.value))
    const slices: Slice<Id>[] = items.map((i) => ({ ...i, share: total ? i.value / total : 0 }))
    return { slices, total }
}

function costBreakdown(range: number[]) {
    const costs = agg.costsByCategory(range)
    return breakdown<CostCategoryId>(COST_CATEGORIES.map((c) => ({ id: c.id, label: categoryLabel(c.id), value: costs[c.id] })))
}

/** Fatturato mese per mese sull'asse del periodo; l'anno scelto si ferma all'ultimo mese chiuso. */
function monthlyRevenue(p: ResolvedPeriod): MonthPoint[] {
    return periodMonths(p.period).map((month) => ({
        month,
        label: monthShort(month),
        current: agg.monthRevenue(monthIndex(p.year, month)),
        previous: agg.monthRevenue(monthIndex(p.compareYear, month)),
    }))
}

function periodFacts(p: ResolvedPeriod): PeriodFacts {
    const { range, compareRange } = p
    const costs = agg.costsByCategory(range)
    const previousCosts = agg.costsByCategory(compareRange)
    const lineRevenue = agg.revenueByLine(range)
    const lineCost = agg.directCostByLine(range)
    const previousLineRevenue = agg.revenueByLine(compareRange)
    const previousLineCost = agg.directCostByLine(compareRange)
    const margin = (revenue: number, cost: number) => (revenue ? (revenue - cost) / revenue : 0)

    const serious = new Map<number, { name: string; count: number; amount: number }>()
    for (const invoice of agg.overdueAt(p.snapshotMonth)) {
        if (invoice.daysLate <= SERIOUS_OVERDUE_DAYS) continue
        const entry = serious.get(invoice.clientId) ?? { name: agg.clientName(invoice.clientId), count: 0, amount: 0 }
        entry.count += 1
        entry.amount += invoice.amount
        serious.set(invoice.clientId, entry)
    }

    const clients = agg.clientStats(range)
    const lowMargin = clients.filter((c) => margin(c.revenue, c.directCost) < CLIENT_MARGIN_FLOOR)

    // La chiusura estiva contro la media degli altri mesi del periodo (servono almeno due mesi di confronto).
    let summerClosure: number | null = null
    const closureMonth = monthIndex(p.year, SUMMER_CLOSURE_MONTH)
    const others = range.filter((m) => m !== closureMonth)
    if (range.includes(closureMonth) && others.length >= 2) {
        summerClosure = agg.revenueOf([closureMonth]) / (agg.revenueOf(others) / others.length) - 1
    }

    return {
        compareLabel: p.compareLabel,
        revenue: { current: agg.revenueOf(range), previous: agg.revenueOf(compareRange) },
        ebitda: { current: agg.ebitdaOf(range), previous: agg.ebitdaOf(compareRange) },
        grossMargin: { current: agg.grossMarginOf(range), previous: agg.grossMarginOf(compareRange) },
        personnelRatio: { current: agg.personnelRatioOf(range), previous: agg.personnelRatioOf(compareRange) },
        dso: { current: agg.dsoAt(p.snapshotMonth), previous: agg.dsoAt(p.compareSnapshotMonth) },
        categories: COST_CATEGORIES.map((c) => ({
            id: c.id,
            label: categoryLabel(c.id),
            current: costs[c.id],
            previous: previousCosts[c.id],
        })),
        lines: LINES.map((l) => ({
            id: l.id,
            label: lineLabel(l.id),
            current: margin(lineRevenue[l.id], lineCost[l.id]),
            previous: margin(previousLineRevenue[l.id], previousLineCost[l.id]),
        })),
        seriousOverdue: [...serious.values()],
        top3Share: agg.top3ShareOf(range),
        activeClients: clients.length,
        lowMarginClients: { count: lowMargin.length, revenue: sum(lowMargin.map((c) => c.revenue)) },
        forecast: agg.forecast(),
        latest: p.latest,
        summerClosure,
    }
}

export function buildOverview(filters: QuadraFilters): OverviewData {
    const p = resolvePeriod(filters)
    const facts = periodFacts(p)
    const clients = agg.clientStats(p.range)
    const total = sum(clients.map((c) => c.revenue))
    const top = clients.slice(0, TOP_CLIENTS).map((c) => ({ id: c.id, name: CLIENTS[c.id].name, share: c.revenue / total }))

    return {
        period: p,
        hero: { value: facts.revenue.current, previous: facts.revenue.previous, months: monthlyRevenue(p) },
        kpis: {
            grossMargin: { value: facts.grossMargin.current, previous: facts.grossMargin.previous },
            ebitda: { value: facts.ebitda.current, previous: facts.ebitda.previous },
            liquidity: { value: agg.balanceAt(p.snapshotMonth), previous: agg.balanceAt(p.compareSnapshotMonth) },
            overdue: { value: agg.overdueTotalAt(p.snapshotMonth), previous: agg.overdueTotalAt(p.compareSnapshotMonth) },
        },
        insight: overviewInsight(facts),
        costs: costBreakdown(p.range),
        concentration: {
            share: facts.top3Share,
            activeClients: clients.length,
            top,
            othersShare: 1 - sum(top.map((t) => t.share)),
        },
        forecast: facts.forecast,
        alerts: overviewAlerts(facts),
    }
}

export function buildRevenue(filters: QuadraFilters): RevenueData {
    const p = resolvePeriod(filters)
    const revenue = agg.revenueOf(p.range)
    const previousRevenue = agg.revenueOf(p.compareRange)
    const clients = agg.clientStats(p.range)
    const previousClients = agg.clientStats(p.compareRange)
    const previousById = new Map(previousClients.map((c) => [c.id, c.revenue]))
    const byArea = agg.revenueByArea(p.range)
    const years = [...YEARS].sort((a, b) => a - b)

    return {
        period: p,
        kpis: {
            revenue: { value: revenue, previous: previousRevenue },
            activeClients: { value: clients.length, previous: previousClients.length },
            avgRevenue: {
                value: revenue / clients.length,
                previous: previousClients.length ? previousRevenue / previousClients.length : null,
            },
            top3Share: { value: agg.top3ShareOf(p.range), previous: agg.top3ShareOf(p.compareRange) },
        },
        monthly: monthlyRevenue(p),
        byLine: p.range.map((m, i) => {
            const lines = agg.revenueByLine([m])
            return { month: p.months[i], label: monthShort(p.months[i]), ...lines }
        }),
        byArea: breakdown(AREAS.map((a) => ({ id: a.id, label: areaLabel(a.id), value: byArea[a.id] }))),
        topClients: clients.slice(0, TOP_CLIENTS_TABLE).map((c) => ({
            id: c.id,
            name: CLIENTS[c.id].name,
            revenue: c.revenue,
            share: c.revenue / revenue,
            previous: previousById.get(c.id) ?? 0,
            lastInvoice: agg.lastInvoiceOf(c.id, p.range) ?? p.snapshot,
        })),
        seasonality: {
            years,
            selected: p.year,
            months: Array.from({ length: 12 }, (_, month) => ({
                month,
                label: monthShort(month),
                values: Object.fromEntries(years.map((y) => [y, agg.monthRevenue(monthIndex(y, month))])),
            })),
        },
    }
}

export function buildCosts(filters: QuadraFilters): CostsData {
    const p = resolvePeriod(filters)
    const facts = periodFacts(p)
    const costs = agg.costsByCategory(p.range)
    const previousCosts = agg.costsByCategory(p.compareRange)
    const lineRevenue = agg.revenueByLine(p.range)
    const lineCost = agg.directCostByLine(p.range)
    const margin = (revenue: number, cost: number) => (revenue ? (revenue - cost) / revenue : 0)
    const rows: LineMarginRow[] = LINES.map((l) => ({
        id: l.id,
        label: lineLabel(l.id),
        revenue: lineRevenue[l.id],
        directCost: lineCost[l.id],
        margin: margin(lineRevenue[l.id], lineCost[l.id]),
    }))
    const totalRevenue = sum(rows.map((r) => r.revenue))
    const totalCost = sum(rows.map((r) => r.directCost))
    const ebitdaShare = facts.revenue.current ? facts.ebitda.current / facts.revenue.current : 0

    return {
        period: p,
        kpis: {
            totalCosts: { value: agg.totalCostsOf(p.range), previous: agg.totalCostsOf(p.compareRange) },
            grossMargin: { value: facts.grossMargin.current, previous: facts.grossMargin.previous },
            ebitda: {
                value: facts.ebitda.current,
                previous: facts.ebitda.previous,
                note: t('kpiNotes.ebitdaShare', { pct: formatPercent(ebitdaShare) }),
            },
            personnelRatio: { value: facts.personnelRatio.current, previous: facts.personnelRatio.previous },
        },
        byCategory: COST_CATEGORIES.map((c) => ({
            id: c.id,
            label: categoryLabel(c.id),
            current: costs[c.id],
            previous: previousCosts[c.id],
        })),
        composition: costBreakdown(p.range),
        lineMargins: {
            rows,
            total: {
                id: 'total',
                label: t('table.total'),
                revenue: totalRevenue,
                directCost: totalCost,
                margin: margin(totalRevenue, totalCost),
            },
        },
        clients: agg.clientStats(p.range).map((c) => ({
            id: c.id,
            name: CLIENTS[c.id].name,
            revenue: c.revenue,
            margin: margin(c.revenue, c.directCost),
            orders: c.orders,
        })),
        alerts: costAlerts(facts),
    }
}

export function buildCash(filters: QuadraFilters): CashData {
    const p = resolvePeriod(filters)
    const overdue = agg.overdueAt(p.snapshotMonth)

    return {
        period: p,
        kpis: {
            liquidity: {
                label: p.latest ? t('kpiNotes.liquidityNow') : t('kpiNotes.liquidityAt', { date: formatDate(p.snapshot) }),
                value: agg.balanceAt(p.snapshotMonth),
                previous: agg.balanceAt(p.compareSnapshotMonth),
            },
            dso: { value: agg.dsoAt(p.snapshotMonth), previous: agg.dsoAt(p.compareSnapshotMonth) },
            dpo: { value: agg.dpoAt(p.snapshotMonth), previous: agg.dpoAt(p.compareSnapshotMonth) },
            overdue: { value: sum(overdue.map((i) => i.amount)), previous: agg.overdueTotalAt(p.compareSnapshotMonth) },
        },
        forecast: agg.forecast(),
        flows: p.range.map((m, i) => {
            const c = agg.cashOf(m)
            return { month: p.months[i], label: monthShort(p.months[i]), inflow: c.inflow, outflow: c.outflow, net: c.inflow - c.outflow }
        }),
        aging: AGING_BUCKETS.map((b) => {
            const items = overdue.filter((i) => i.bucket === b.id)
            return { id: b.id, label: bucketLabel(b.id), value: sum(items.map((i) => i.amount)), count: items.length }
        }),
        overdue: {
            rows: overdue.map((i) => ({
                number: i.number,
                client: agg.clientName(i.clientId),
                amount: i.amount,
                daysLate: i.daysLate,
                due: i.due,
                bucket: i.bucket,
            })),
            total: sum(overdue.map((i) => i.amount)),
        },
    }
}
