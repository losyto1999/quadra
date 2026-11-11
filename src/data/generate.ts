import {
    CLOSED_MONTHS,
    CURRENT_YEAR,
    FIRST_GENERATED_MONTH,
    LAST_CLOSED_MONTH,
    monthIndex,
    monthOf,
    yearOf,
} from './calendar'
import {
    annualRevenue,
    CASH_THRESHOLD,
    CLIENTS,
    LINE_MARGIN,
    LINES,
    LOGISTICS_GROWTH,
    SEASONALITY,
    TOP3_SPLIT,
    top3Share,
} from './company'
import { hash01, intBetween, jitter } from './random'
import { SERIOUS_OVERDUE_DAYS } from './rules'
import type { Dataset, Invoice, MonthCash, MonthOverheads, RawForecast, RawForecastMonth, SaleRow } from './types'

// Costruisce una volta sola, in modo deterministico, il dataset di base da cui deriva ogni numero della dashboard.
// Le anomalie richieste sono imposte qui, rispetto all'anno corrente (CURRENT_YEAR):
// - agosto a circa −40% (SEASONALITY);
// - i primi tre clienti esattamente al 41% dei ricavi, mese per mese (top3Share);
// - gli Assemblaggi su misura esattamente al 21% di margine lordo, mese per mese (LINE_MARGIN);
// - la logistica +22% sullo stesso mese dell'anno prima (LOGISTICS_GROWTH);
// - Edil Nord con le ultime tre fatture mai pagate, scadute da oltre 60 giorni.

/** "Sale" dei numeri pseudo-casuali: ogni grandezza ha il suo, così non sono correlate tra loro. */
const SALT = {
    total: 1,
    topSplit: 2,
    weight: 3,
    buys: 4,
    lineMix: 5,
    orders: 6,
    issueDay: 7,
    payDelay: 8,
    structure: 9,
    logistics: 10,
    marketing: 11,
}

/** Rata del finanziamento, pagata ogni mese. */
const LOAN_INSTALLMENT = 22_000
/** Nuovo centro di lavoro, pagato ad aprile dell'anno scorso: spiega il calo di liquidità di allora. */
const INVESTMENT = 300_000
const INVESTMENT_MONTH = monthIndex(CURRENT_YEAR - 1, 3)
/** Liquidità minima prevista, come multiplo della soglia: la previsione si avvicina alla soglia senza superarla. */
const FORECAST_MIN_RATIO = 1.22
/** Mesi di previsione dopo l'ultimo mese chiuso. */
export const FORECAST_MONTHS = 6
/** I primi mesi della previsione vengono da incassi e pagamenti già noti ("da scadenzario"), gli altri sono stime. */
const FORECAST_SCHEDULED_MONTHS = 2

/** Edil Nord smette di ordinare dopo questo mese (fido bloccato); le fatture degli ultimi tre mesi restano da pagare. */
const TROUBLE_LAST_ORDER = monthIndex(CURRENT_YEAR, CLOSED_MONTHS - 4)
/** Giorno fisso delle fatture di Edil Nord: al 30 del mese di riferimento − 1 sono scadute da oltre 60 giorni. */
const TROUBLE_ISSUE_DAY = 15

const offsetOf = (month: number) => yearOf(month) - CURRENT_YEAR
const inflation = (month: number) => 1.025 ** offsetOf(month)
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)

function generateSales(): SaleRow[] {
    const rows: SaleRow[] = []
    const boughtThisQuarter = new Set<number>()

    for (let m = FIRST_GENERATED_MONTH; m <= LAST_CLOSED_MONTH; m++) {
        const offset = offsetOf(m)
        const month = monthOf(m)
        if (month % 3 === 0) boughtThisQuarter.clear()

        const total = (annualRevenue(offset) / 12) * SEASONALITY[month] * jitter(0.03, SALT.total, m)
        const active = CLIENTS.filter(
            (c) => offset >= c.from && offset <= c.to && !(c.troubled && m > TROUBLE_LAST_ORDER),
        )
        const amounts = new Map<number, number>()

        // I tre principali ordinano ogni mese e insieme fanno esattamente la quota dell'anno.
        const tops = active.filter((c) => c.top)
        const topWeights = tops.map((c) => TOP3_SPLIT[(c.top ?? 1) - 1] * jitter(0.05, SALT.topSplit, m, c.id))
        const topTotal = total * top3Share(offset)
        tops.forEach((c, i) => amounts.set(c.id, (topTotal * topWeights[i]) / sum(topWeights)))

        // Gli altri ordinano con la loro frequenza, e comunque almeno una volta a trimestre.
        const buyers = active.filter((c) => {
            if (c.top) return false
            const buys = hash01(SALT.buys, m, c.id) < c.frequency || (month % 3 === 2 && !boughtThisQuarter.has(c.id))
            if (buys) boughtThisQuarter.add(c.id)
            return buys
        })
        const weights = buyers.map((c) => c.weight * jitter(0.3, SALT.weight, m, c.id))
        buyers.forEach((c, i) => amounts.set(c.id, ((total - topTotal) * weights[i]) / sum(weights)))

        for (const [clientId, amount] of amounts) {
            const client = CLIENTS[clientId]
            const parts = LINES.map((_, li) => client.mix[li] * jitter(0.15, SALT.lineMix, m, clientId, li))
            LINES.forEach((line, li) => {
                const revenue = Math.round((amount * parts[li]) / sum(parts))
                if (revenue <= 0) return
                rows.push({
                    month: m,
                    clientId,
                    line: line.id,
                    revenue,
                    // Provvisorio: calibrato sotto perché il margine della linea sia quello voluto.
                    directCost: revenue * (1 - LINE_MARGIN[line.id](offset) - client.marginDev),
                    materials: 0,
                    labor: 0,
                    orders: Math.max(1, Math.round((revenue / line.orderValue) * jitter(0.2, SALT.orders, m, clientId, li))),
                })
            })
        }
    }

    // Margine di ogni linea esatto in ogni mese: i costi diretti si riscalano tutti insieme, quindi gli
    // scostamenti tra clienti restano (chi compra soprattutto Assemblaggi scende sotto il 20%).
    const groups = new Map<string, SaleRow[]>()
    for (const row of rows) {
        const key = `${row.month}:${row.line}`
        const group = groups.get(key)
        if (group) group.push(row)
        else groups.set(key, [row])
    }
    for (const group of groups.values()) {
        const { month, line } = group[0]
        const revenue = sum(group.map((r) => r.revenue))
        const target = revenue * (1 - LINE_MARGIN[line](offsetOf(month)))
        const k = target / sum(group.map((r) => r.directCost))
        const materialsShare = LINES.find((l) => l.id === line)?.materialsShare ?? 0.5
        for (const row of group) {
            row.directCost = Math.round(row.directCost * k)
            row.materials = Math.round(row.directCost * materialsShare)
            row.labor = row.directCost - row.materials
        }
    }

    return rows
}

function generateInvoices(sales: SaleRow[]): Invoice[] {
    const amounts = new Map<string, { month: number; clientId: number; amount: number }>()
    for (const row of sales) {
        const key = `${row.month}:${row.clientId}`
        const entry = amounts.get(key)
        if (entry) entry.amount += row.revenue
        else amounts.set(key, { month: row.month, clientId: row.clientId, amount: row.revenue })
    }

    const invoices = [...amounts.values()].map(({ month, clientId, amount }) => {
        const client = CLIENTS[clientId]
        const day = client.troubled ? TROUBLE_ISSUE_DAY : intBetween(3, 28, SALT.issueDay, month, clientId)
        const issued = new Date(yearOf(month), monthOf(month), day)
        const due = addDays(issued, client.terms)
        const unpaid = client.troubled && month > TROUBLE_LAST_ORDER - 3
        // Ritardi sotto la soglia degli avvisi critici: oltre c'è solo Edil Nord.
        const delay = Math.min(SERIOUS_OVERDUE_DAYS - 5, Math.max(-8, client.payDelay + intBetween(-6, 14, SALT.payDelay, month, clientId)))
        return { number: '', clientId, month, issued, due, paid: unpaid ? null : addDays(due, delay), amount }
    })

    // Numerazione progressiva per anno, in ordine di emissione ("2026/0142").
    invoices.sort((a, b) => a.issued.getTime() - b.issued.getTime() || a.clientId - b.clientId)
    const counters = new Map<number, number>()
    for (const invoice of invoices) {
        const year = yearOf(invoice.month)
        const n = (counters.get(year) ?? 0) + 1
        counters.set(year, n)
        invoice.number = `${year}/${String(n).padStart(4, '0')}`
    }
    return invoices
}

function generateOverheads(revenueByMonth: Map<number, number>) {
    const overheads = new Map<number, MonthOverheads>()
    for (let m = FIRST_GENERATED_MONTH; m <= LAST_CLOSED_MONTH; m++) {
        const f = inflation(m)
        const month = monthOf(m)
        const revenue = revenueByMonth.get(m) ?? 0
        // Riscaldamento d'inverno, climatizzazione d'estate.
        const seasonal = month === 0 || month === 1 || month === 11 ? 4_000 : month === 6 || month === 7 ? 1_500 : 0
        const previous = overheads.get(m - 12)
        overheads.set(m, {
            indirectLabor: Math.round(40_000 * f),
            structure: Math.round((29_000 + seasonal) * f * jitter(0.02, SALT.structure, m)),
            logistics:
                offsetOf(m) < 0 || !previous
                    ? Math.round(revenue * 0.036 * jitter(0.05, SALT.logistics, m))
                    : Math.round(previous.logistics * (1 + LOGISTICS_GROWTH)),
            // Fiera a marzo, campagna a ottobre.
            marketing: Math.round(
                revenue * 0.011 * jitter(0.1, SALT.marketing, m) + (month === 2 ? 14_000 : month === 9 ? 10_000 : 0) * f,
            ),
        })
    }
    return overheads
}

/** Grandezze mensili che muovono la cassa; oltre l'ultimo mese chiuso sono proiezioni. */
interface CashBasis {
    revenue: number
    payroll: number
    materials: number
    structure: number
    logistics: number
    marketing: number
}

/** Quota degli acquisti di materie prime pagata dopo `lag` mesi: dall'anno corrente metà a 60 e metà a 90 giorni. */
function materialsPaidShare(purchaseMonth: number, lag: number) {
    if (offsetOf(purchaseMonth) < 0) return lag === 2 ? 1 : 0
    return lag === 2 || lag === 3 ? 0.5 : 0
}

function generateCash(
    sales: SaleRow[],
    invoices: Invoice[],
    overheads: Map<number, MonthOverheads>,
): { cash: Map<number, MonthCash>; payables: Map<number, number>; forecast: RawForecast } {
    const basis = new Map<number, CashBasis>()
    const ensure = (m: number) => {
        let b = basis.get(m)
        if (!b) {
            b = { revenue: 0, payroll: 0, materials: 0, structure: 0, logistics: 0, marketing: 0 }
            basis.set(m, b)
        }
        return b
    }
    for (const row of sales) {
        const b = ensure(row.month)
        b.revenue += row.revenue
        b.payroll += row.labor
        b.materials += row.materials
    }
    for (const [m, o] of overheads) {
        const b = ensure(m)
        b.payroll += o.indirectLabor
        b.structure = o.structure
        b.logistics = o.logistics
        b.marketing = o.marketing
    }

    // Proiezione dei mesi futuri: stesso mese dell'anno prima, cresciuto come il fatturato da inizio anno.
    const ytd = (year: number) => {
        let total = 0
        for (let mo = 0; mo < CLOSED_MONTHS; mo++) total += basis.get(monthIndex(year, mo))?.revenue ?? 0
        return total
    }
    const growth = ytd(CURRENT_YEAR) / ytd(CURRENT_YEAR - 1)
    for (let m = LAST_CLOSED_MONTH + 1; m <= LAST_CLOSED_MONTH + FORECAST_MONTHS; m++) {
        const last = ensure(m - 12)
        basis.set(m, {
            revenue: last.revenue * growth,
            payroll: last.payroll * 1.03,
            materials: last.materials * growth,
            structure: last.structure * 1.025,
            // Se il mese di un anno fa è precedente al rincaro, il rincaro si applica anche qui.
            logistics: last.logistics * (offsetOf(m - 12) < 0 ? 1 + LOGISTICS_GROWTH : growth),
            marketing: last.marketing * 1.03,
        })
    }
    const at = (m: number) => basis.get(m) ?? { revenue: 0, payroll: 0, materials: 0, structure: 0, logistics: 0, marketing: 0 }

    // Incassi: le fatture alla loro data di pagamento (anche quelle attese dopo l'ultimo mese chiuso).
    // Nei mesi di previsione si aggiunge il fatturato stimato, incassato con gli stessi tempi delle
    // fatture dell'ultimo anno (quota incassata dopo 0, 1, 2… mesi).
    const inflowByMonth = new Map<number, number>()
    const lagProfile = [0, 0, 0, 0, 0, 0]
    for (const invoice of invoices) {
        if (!invoice.paid) continue
        const m = monthIndex(invoice.paid.getFullYear(), invoice.paid.getMonth())
        inflowByMonth.set(m, (inflowByMonth.get(m) ?? 0) + invoice.amount)
        if (invoice.month > LAST_CLOSED_MONTH - 15 && invoice.month <= LAST_CLOSED_MONTH - 3) {
            lagProfile[Math.min(Math.max(m - invoice.month, 0), lagProfile.length - 1)] += invoice.amount
        }
    }
    const profileTotal = sum(lagProfile)
    const inflow = (m: number) => {
        let projected = 0
        lagProfile.forEach((amount, lag) => {
            if (m - lag > LAST_CLOSED_MONTH) projected += (at(m - lag).revenue * amount) / profileTotal
        })
        return (inflowByMonth.get(m) ?? 0) + projected
    }

    const outflow = (m: number) => {
        const month = monthOf(m)
        const f = inflation(m)
        // Stipendi su 13 mensilità: la tredicesima esce a dicembre.
        let payroll = at(m).payroll * (12 / 13)
        if (month === 11) {
            for (let mo = 0; mo < 12; mo++) payroll += at(monthIndex(yearOf(m), mo)).payroll / 13
        }
        let materials = 0
        for (const lag of [2, 3]) materials += at(m - lag).materials * materialsPaidShare(m - lag, lag)
        const taxes = month === 5 ? 75_000 * f : month === 10 ? 55_000 * f : 0
        const dividends = month === 4 ? 120_000 * f : 0
        const investment = m === INVESTMENT_MONTH ? INVESTMENT : 0
        return (
            payroll +
            materials +
            at(m).structure +
            at(m - 1).logistics +
            at(m - 1).marketing +
            LOAN_INSTALLMENT +
            taxes +
            dividends +
            investment
        )
    }

    // Saldi con apertura a zero, poi l'apertura si sceglie in base al minimo della previsione.
    const cash = new Map<number, MonthCash>()
    let balance = 0
    for (let m = FIRST_GENERATED_MONTH; m <= LAST_CLOSED_MONTH; m++) {
        const i = Math.round(inflow(m))
        const o = Math.round(outflow(m))
        balance += i - o
        cash.set(m, { inflow: i, outflow: o, balance })
    }
    const projected: { month: number; balance: number }[] = []
    for (let m = LAST_CLOSED_MONTH + 1; m <= LAST_CLOSED_MONTH + FORECAST_MONTHS; m++) {
        balance += Math.round(inflow(m) - outflow(m))
        projected.push({ month: m, balance })
    }
    const minProjected = Math.min(...projected.map((p) => p.balance))
    const opening = Math.round((CASH_THRESHOLD * FORECAST_MIN_RATIO - minProjected) / 1_000) * 1_000
    for (const entry of cash.values()) entry.balance += opening

    const months: RawForecastMonth[] = projected.map(({ month, balance: b }, i) => ({
        month,
        balance: b + opening,
        kind: i < FORECAST_SCHEDULED_MONTHS ? 'scheduled' : 'estimate',
    }))
    const min = months.reduce((a, b) => (b.balance < a.balance ? b : a))
    // Niente etichette di mese qui: il dataset si genera una volta sola e deve restare uguale in tutte le lingue.
    const forecast: RawForecast = { months, min, threshold: CASH_THRESHOLD }

    // Debiti verso fornitori a fine mese: materie prime non ancora pagate, logistica e marketing del mese.
    const payables = new Map<number, number>()
    for (let m = FIRST_GENERATED_MONTH; m <= LAST_CLOSED_MONTH; m++) {
        const materials =
            at(m).materials + at(m - 1).materials + at(m - 2).materials * materialsPaidShare(m - 2, 3)
        payables.set(m, Math.round(materials + at(m).logistics + at(m).marketing))
    }

    return { cash, payables, forecast }
}

export function generateDataset(): Dataset {
    const sales = generateSales()
    const salesByMonth = new Map<number, SaleRow[]>()
    const revenueByMonth = new Map<number, number>()
    for (const row of sales) {
        const list = salesByMonth.get(row.month)
        if (list) list.push(row)
        else salesByMonth.set(row.month, [row])
        revenueByMonth.set(row.month, (revenueByMonth.get(row.month) ?? 0) + row.revenue)
    }
    const invoices = generateInvoices(sales)
    const overheads = generateOverheads(revenueByMonth)
    const { cash, payables, forecast } = generateCash(sales, invoices, overheads)
    return { sales, salesByMonth, invoices, overheads, cash, payables, forecast }
}

