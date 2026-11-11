import { currentLang, currentLocale, formatList, translate as t } from '../i18n/locale'
import {
    formatCount,
    formatDays,
    formatEuro,
    formatEuroCompact,
    formatPercent,
    formatPercentRounded,
    formatPoints,
    monthLong,
} from '../utils/format'
import type { CostCategoryId, LineId } from './company'
import { SUMMER_CLOSURE_MONTH } from './company'
import { ALERT_RULES as RULES, CLIENT_MARGIN_FLOOR, SERIOUS_OVERDUE_DAYS, TOP_CLIENTS } from './rules'
import type { Alert, Forecast, Severity } from './types'

// Testi generati dai dati del periodo: nessuna frase fissa, cambiano a ogni filtro. Le frasi stanno in
// locales/*.json (chiave `insights.*`) come modelli con segnaposto: la grammatica di ogni lingua (articoli
// articolati, accordi, ordine delle parole) resta nel modello e non nel codice.

export interface Pair {
    current: number
    previous: number
}

/** Quello che serve a insight e avvisi, già calcolato per il periodo scelto (views.ts). */
export interface PeriodFacts {
    compareLabel: string
    revenue: Pair
    ebitda: Pair
    grossMargin: Pair
    personnelRatio: Pair
    dso: Pair
    categories: (Pair & { id: CostCategoryId; label: string })[]
    lines: (Pair & { id: LineId; label: string })[]
    /** Clienti con fatture scadute da oltre SERIOUS_OVERDUE_DAYS giorni alla data del periodo. */
    seriousOverdue: { name: string; count: number; amount: number }[]
    top3Share: number
    activeClients: number
    lowMarginClients: { count: number; revenue: number }
    forecast: Forecast
    /** Il periodo arriva all'ultimo mese chiuso: solo allora ha senso avvisare sulla previsione di cassa. */
    latest: boolean
    /** Il mese della chiusura estiva rispetto alla media degli altri mesi del periodo, se il periodo lo comprende. */
    summerClosure: number | null
}

const growth = ({ current, previous }: Pair) => (previous ? (current - previous) / Math.abs(previous) : 0)

/**
 * Le percentuali nelle frasi. Ogni modello sceglie quale usare: `pct` è la cifra ("5,8%"), `ofPct` e `atPct`
 * sono la stessa cifra con la preposizione articolata che l'italiano chiede davanti ("del 5,8%" ma "dell'1,7%",
 * "al 21,0%" ma "all'11,8%": l'articolo segue la pronuncia del numero). Gli altri modelli le ignorano.
 */
function percentParams(ratio: number) {
    const abs = Math.abs(ratio)
    const whole = Math.floor(abs * 100 + 0.05)
    const vowel = whole === 1 || whole === 11 || String(whole).startsWith('8')
    const pct = formatPercent(abs)
    const it = currentLang() === 'it'
    return {
        pct,
        ofPct: it ? `${vowel ? "dell'" : 'del '}${pct}` : pct,
        atPct: it ? `${vowel ? "all'" : 'al '}${pct}` : pct,
    }
}

const signed = (ratio: number) => `${ratio >= 0 ? '+' : ''}${formatPercent(ratio)}`
const signedPoints = (diff: number) => `${diff >= 0 ? '+' : '−'}${formatPoints(diff)}`

/** Le cause da citare: la categoria che cresce di più oltre il 10% e la linea col margine più basso sotto il 25%. */
function causes(f: PeriodFacts) {
    const items: string[] = []
    const category = [...f.categories].sort((a, b) => growth(b) - growth(a))[0]
    if (category && growth(category) > RULES.insightCostGrowth) {
        items.push(t('insights.cause.category', { phrase: t(`insights.phrases.${category.id}`), change: signed(growth(category)) }))
    }
    const line = [...f.lines].sort((a, b) => a.current - b.current)[0]
    if (line && line.current < RULES.lineMargin) {
        items.push(t(`insights.cause.line.${line.id}`, { label: line.label, ...percentParams(line.current) }))
    }
    return items
}

export function overviewInsight(f: PeriodFacts) {
    const revenue = growth(f.revenue)
    const ebitda = growth(f.ebitda)
    const ebitdaUp = ebitda >= 0
    const revenueText = t(revenue >= 0 ? 'insights.revenue.up' : 'insights.revenue.down', {
        ...percentParams(revenue),
        compare: f.compareLabel,
    })
    const link = ebitdaUp === revenue >= 0 ? 'same' : 'but'
    const ebitdaText = t(`insights.ebitda.${link}.${ebitdaUp ? 'up' : 'down'}`, percentParams(ebitda))
    const reasons = causes(f)

    let second: string
    if (reasons.length) {
        second = ebitdaUp
            ? t('insights.reasons.watch', { list: formatList(reasons) })
            : t('insights.reasons.weigh', { count: reasons.length, list: formatList(reasons) })
    } else {
        const margin = f.grossMargin.current - f.grossMargin.previous
        second = t('insights.grossMargin', { ...percentParams(f.grossMargin.current), points: signedPoints(margin) })
    }
    return `${revenueText}${ebitdaText}. ${second}`
}

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, warning: 1, info: 2 }

function sortAlerts(alerts: (Alert & { score: number })[]) {
    return alerts
        .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.score - a.score)
        .map(({ id, severity, subject, description }) => ({ id, severity, subject, description }))
}

function forecastAlert(f: PeriodFacts): (Alert & { score: number }) | null {
    const { min, threshold } = f.forecast
    if (min.balance >= threshold * RULES.forecastNearThreshold) return null
    const below = min.balance < threshold
    return {
        id: 'forecast',
        severity: below ? 'critical' : 'info',
        subject: t('insights.alerts.forecast.subject'),
        description: t(below ? 'insights.alerts.forecast.below' : 'insights.alerts.forecast.near', {
            threshold: formatEuroCompact(threshold),
            month: min.longLabel,
            balance: formatEuroCompact(min.balance),
        }),
        score: 0,
    }
}

/** Avvisi della Panoramica, i più gravi per primi. Le regole informative garantiscono sempre qualche voce. */
export function overviewAlerts(f: PeriodFacts, limit = 3): Alert[] {
    const alerts: (Alert & { score: number })[] = []

    for (const client of f.seriousOverdue) {
        alerts.push({
            id: `overdue-${client.name}`,
            severity: 'critical',
            subject: client.name,
            description: t('insights.alerts.overdue', {
                invoices: formatCount('overdueInvoices', client.count),
                days: SERIOUS_OVERDUE_DAYS,
                amount: formatEuro(client.amount),
            }),
            score: client.amount,
        })
    }
    for (const category of f.categories) {
        const g = growth(category)
        if (g > RULES.alertCostGrowth) {
            alerts.push({
                id: `cost-${category.id}`,
                severity: 'warning',
                subject: category.label,
                description: t('insights.alerts.cost', { change: signed(g), compare: f.compareLabel }),
                score: g,
            })
        }
    }
    for (const line of f.lines) {
        if (line.current < RULES.lineMargin) {
            alerts.push({
                id: `line-${line.id}`,
                severity: 'warning',
                subject: line.label,
                description: t('insights.alerts.lineMargin', {
                    ...percentParams(line.current),
                    previous: formatPercent(line.previous),
                    compare: f.compareLabel,
                }),
                // Dopo i costi: a parità di gravità conta prima l'aumento più forte.
                score: (RULES.lineMargin - line.current) / 10,
            })
        }
    }
    if (f.top3Share > RULES.concentration) {
        alerts.push({
            id: 'concentration',
            severity: 'info',
            subject: t('insights.alerts.concentration.subject'),
            description: t('insights.alerts.concentration.text', {
                pct: formatPercentRounded(f.top3Share),
                n: TOP_CLIENTS,
                total: f.activeClients,
            }),
            score: 3,
        })
    }
    const cash = f.latest ? forecastAlert(f) : null
    if (cash) alerts.push({ ...cash, score: 2 })
    if (f.summerClosure !== null) {
        const month = monthLong(SUMMER_CLOSURE_MONTH)
        alerts.push({
            id: 'summer-closure',
            severity: 'info',
            subject: month.charAt(0).toLocaleUpperCase(currentLocale()) + month.slice(1),
            description: t('insights.alerts.summerClosure', { pct: formatPercentRounded(f.summerClosure) }),
            score: 1,
        })
    }
    const dsoDiff = Math.round(f.dso.current) - Math.round(f.dso.previous)
    alerts.push({
        id: 'dso',
        severity: 'info',
        subject: t('insights.alerts.dso.subject'),
        description: t('insights.alerts.dso.text', {
            dso: formatDays(f.dso.current),
            diff: `${dsoDiff >= 0 ? '+' : '−'}${formatDays(Math.abs(dsoDiff))}`,
            compare: f.compareLabel,
        }),
        score: 0,
    })

    return sortAlerts(alerts).slice(0, limit)
}

/** Avvisi della pagina Costi e margini. */
export function costAlerts(f: PeriodFacts, limit = 4): Alert[] {
    const alerts: (Alert & { score: number })[] = []

    for (const category of f.categories) {
        const g = growth(category)
        if (g > RULES.insightCostGrowth) {
            alerts.push({
                id: `cost-${category.id}`,
                severity: g > RULES.alertCostGrowth ? 'warning' : 'info',
                subject: category.label,
                description: t('insights.alerts.costWithAmount', {
                    change: signed(g),
                    compare: f.compareLabel,
                    amount: formatEuroCompact(category.current),
                }),
                score: g,
            })
        }
    }
    for (const line of f.lines) {
        if (line.current < RULES.lineMargin) {
            alerts.push({
                id: `line-${line.id}`,
                severity: 'warning',
                subject: line.label,
                description: t('insights.alerts.lineMarginChange', {
                    ...percentParams(line.current),
                    points: signedPoints(line.current - line.previous),
                    compare: f.compareLabel,
                }),
                score: (RULES.lineMargin - line.current) / 10,
            })
        }
    }
    if (f.lowMarginClients.count > 0) {
        alerts.push({
            id: 'client-margin',
            severity: 'warning',
            subject: t('insights.alerts.clientMargin.subject'),
            description: t('insights.alerts.clientMargin.text', {
                clients: formatCount('clients', f.lowMarginClients.count),
                floor: formatPercentRounded(CLIENT_MARGIN_FLOOR),
                revenue: formatEuroCompact(f.lowMarginClients.revenue),
            }),
            score: 0,
        })
    }
    const personnel = f.personnelRatio.current - f.personnelRatio.previous
    if (personnel > RULES.personnelRise) {
        alerts.push({
            id: 'personnel',
            severity: 'info',
            subject: t('insights.alerts.personnel.subject'),
            description: t('insights.alerts.personnel.text', {
                ...percentParams(f.personnelRatio.current),
                points: signedPoints(personnel),
            }),
            score: personnel,
        })
    }
    const ebitdaMargin = f.revenue.current ? f.ebitda.current / f.revenue.current : 0
    const ebitdaMarginPrev = f.revenue.previous ? f.ebitda.previous / f.revenue.previous : 0
    if (ebitdaMargin < ebitdaMarginPrev) {
        alerts.push({
            id: 'ebitda',
            severity: 'info',
            subject: t('insights.alerts.ebitda.subject'),
            description: t('insights.alerts.ebitda.text', {
                ...percentParams(ebitdaMargin),
                points: signedPoints(ebitdaMargin - ebitdaMarginPrev),
                compare: f.compareLabel,
            }),
            score: 0,
        })
    }
    if (!alerts.length) {
        alerts.push({
            id: 'no-cost-alerts',
            severity: 'info',
            subject: t('insights.alerts.noCostAlerts.subject'),
            description: t('insights.alerts.noCostAlerts.text', {
                pct: formatPercentRounded(RULES.insightCostGrowth),
                compare: f.compareLabel,
            }),
            score: 0,
        })
    }
    return sortAlerts(alerts).slice(0, limit)
}
