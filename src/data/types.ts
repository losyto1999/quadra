import type { ResolvedPeriod } from './calendar'
import type { AreaId, CostCategoryId, LineId } from './company'

// ---------------------------------------------------------------------------------------------
// Dataset di base (generate.ts): l'unica fonte di tutti i numeri.
// ---------------------------------------------------------------------------------------------

/** Vendite di un cliente su una linea in un mese. */
export interface SaleRow {
    month: number
    clientId: number
    line: LineId
    revenue: number
    /** Costi diretti = materie prime + manodopera diretta. */
    directCost: number
    materials: number
    labor: number
    orders: number
}

/** Una fattura per cliente e mese, somma delle sue righe di vendita. */
export interface Invoice {
    number: string
    clientId: number
    month: number
    issued: Date
    due: Date
    /** null = mai incassata. Le date oltre l'ultimo mese chiuso sono gli incassi attesi. */
    paid: Date | null
    amount: number
}

/** Costi indiretti del mese. */
export interface MonthOverheads {
    indirectLabor: number
    structure: number
    logistics: number
    marketing: number
}

/** Movimenti di cassa del mese e saldo a fine mese. */
export interface MonthCash {
    inflow: number
    outflow: number
    balance: number
}

export interface ForecastMonth {
    month: number
    /** "dic", "dicembre", "dicembre 2026". */
    label: string
    name: string
    longLabel: string
    balance: number
    /** I primi due mesi vengono da incassi e pagamenti già noti, gli altri sono una stima. */
    kind: 'scheduled' | 'estimate'
}

export interface Forecast {
    months: ForecastMonth[]
    min: ForecastMonth
    threshold: number
    /** "ott 2026 – mar 2027". */
    rangeLabel: string
}

/** La previsione senza testi, come la genera il dataset (uguale in tutte le lingue): le etichette si aggiungono a ogni lettura. */
export type RawForecastMonth = Omit<ForecastMonth, 'label' | 'name' | 'longLabel'>
export interface RawForecast {
    months: RawForecastMonth[]
    min: RawForecastMonth
    threshold: number
}

export interface Dataset {
    sales: SaleRow[]
    salesByMonth: Map<number, SaleRow[]>
    invoices: Invoice[]
    overheads: Map<number, MonthOverheads>
    cash: Map<number, MonthCash>
    /** Acquisti da fornitori ancora da pagare a fine mese (materie prime, logistica, marketing). */
    payables: Map<number, number>
    forecast: RawForecast
}

// ---------------------------------------------------------------------------------------------
// Dati restituiti dall'API (api/dashboard.ts) alle pagine.
// ---------------------------------------------------------------------------------------------

/** Se un aumento è una buona notizia (ricavi) o una cattiva (costi). */
export type Polarity = 'up-good' | 'up-bad'
/** Come si esprime la variazione: % per gli importi, punti per le percentuali, giorni, unità. */
export type DeltaKind = 'relative' | 'points' | 'days' | 'count'
export type ValueFormat = 'euro' | 'percent' | 'days' | 'count'

export interface KpiValue {
    value: number
    previous: number | null
    /** Etichetta che dipende dal periodo ("Liquidità al 31/12/2024"), al posto di quella fissa. */
    label?: string
    /** Riga sotto il valore ("11,7% del fatturato"). */
    note?: string
}

export interface MonthPoint {
    month: number
    label: string
    current: number | null
    previous: number | null
}

export interface Slice<Id extends string = string> {
    id: Id
    label: string
    value: number
    share: number
}

export interface Breakdown<Id extends string = string> {
    slices: Slice<Id>[]
    total: number
}

export type Severity = 'critical' | 'warning' | 'info'

export interface Alert {
    id: string
    severity: Severity
    subject: string
    description: string
}

export interface OverviewData {
    period: ResolvedPeriod
    hero: { value: number; previous: number; months: MonthPoint[] }
    kpis: { grossMargin: KpiValue; ebitda: KpiValue; liquidity: KpiValue; overdue: KpiValue }
    insight: string
    costs: Breakdown<CostCategoryId>
    concentration: {
        share: number
        activeClients: number
        top: { id: number; name: string; share: number }[]
        othersShare: number
    }
    forecast: Forecast
    alerts: Alert[]
}

export interface TopClientRow {
    id: number
    name: string
    revenue: number
    share: number
    /** Fatturato nel periodo di confronto: 0 se allora non era cliente. */
    previous: number
    lastInvoice: Date
}

export interface RevenueData {
    period: ResolvedPeriod
    kpis: { revenue: KpiValue; activeClients: KpiValue; avgRevenue: KpiValue; top3Share: KpiValue }
    monthly: MonthPoint[]
    byLine: ({ month: number; label: string } & Record<LineId, number>)[]
    byArea: Breakdown<AreaId>
    topClients: TopClientRow[]
    seasonality: {
        years: number[]
        selected: number
        months: { month: number; label: string; values: Record<number, number | null> }[]
    }
}

export interface LineMarginRow {
    id: LineId | 'total'
    label: string
    revenue: number
    directCost: number
    margin: number
}

export interface ClientMarginPoint {
    id: number
    name: string
    revenue: number
    margin: number
    orders: number
}

export interface CostsData {
    period: ResolvedPeriod
    kpis: { totalCosts: KpiValue; grossMargin: KpiValue; ebitda: KpiValue; personnelRatio: KpiValue }
    byCategory: { id: CostCategoryId; label: string; current: number; previous: number }[]
    composition: Breakdown<CostCategoryId>
    lineMargins: { rows: LineMarginRow[]; total: LineMarginRow }
    clients: ClientMarginPoint[]
    alerts: Alert[]
}

export type AgingBucketId = 'b0' | 'b30' | 'b60' | 'b90'

export interface OverdueRow {
    number: string
    client: string
    amount: number
    daysLate: number
    due: Date
    bucket: AgingBucketId
}

export interface CashData {
    period: ResolvedPeriod
    kpis: { liquidity: KpiValue; dso: KpiValue; dpo: KpiValue; overdue: KpiValue }
    forecast: Forecast
    flows: { month: number; label: string; inflow: number; outflow: number; net: number }[]
    aging: { id: AgingBucketId; label: string; value: number; count: number }[]
    overdue: { rows: OverdueRow[]; total: number }
}
