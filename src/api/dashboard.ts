// API della dashboard, simulata: il progetto non ha un backend.
// Quattro chiamate, una per pagina, ognuna con un'attesa tra 300 e 600 ms per simulare la rete (vedi
// mock.ts). I dati sono calcolati da data/views.ts sul dataset deterministico di data/generate.ts:
// stessi filtri nello stesso mese, stessi numeri. Insight, avvisi ed etichette arrivano già scritti
// nella lingua attiva: quando cambia, useQuadraData richiede di nuovo i dati.
//
// Per passare a un'API reale basta che queste funzioni facciano una fetch e restituiscano gli stessi
// tipi di data/types.ts (es. GET /api/overview?anno=2026&periodo=full, con lo stesso `signal` per
// annullarla e la lingua nell'header Accept-Language): pagine e componenti non cambiano.

import { isPeriodAvailable, YEARS } from '../data/calendar'
import type { QuadraFilters } from '../data/calendar'
import type { CashData, CostsData, OverviewData, RevenueData } from '../data/types'
import { buildCash, buildCosts, buildOverview, buildRevenue } from '../data/views'
import { delay } from './mock'

/** Anno o periodo non disponibili: anno senza dati, periodo sconosciuto o senza mesi chiusi. */
export class InvalidFiltersError extends Error {
    readonly field: 'year' | 'period'
    /** Il valore ricevuto, così com'era (anche testo arrivato dall'URL). */
    readonly value: string
    constructor(field: 'year' | 'period', value: string) {
        super('invalid-filters')
        this.name = 'InvalidFiltersError'
        this.field = field
        this.value = value
    }
}

export interface RequestOptions {
    /** Annulla la richiesta, come con `fetch`: la promessa rifiuta con un `AbortError`. */
    signal?: AbortSignal
}

/** Controlla i filtri come farebbe il server; fallisce con `InvalidFiltersError`. */
export function checkFilters({ year, period }: QuadraFilters) {
    if (!YEARS.includes(year)) throw new InvalidFiltersError('year', String(year))
    if (!isPeriodAvailable(year, period)) throw new InvalidFiltersError('period', period)
}

function request<T>(filters: QuadraFilters, build: (filters: QuadraFilters) => T, options?: RequestOptions) {
    return delay(() => {
        checkFilters(filters)
        return build(filters)
    }, options?.signal)
}

/** Panoramica: fatturato, KPI, insight, costi, concentrazione, liquidità prevista e avvisi. */
export function getOverview(filters: QuadraFilters, options?: RequestOptions): Promise<OverviewData> {
    return request(filters, buildOverview, options)
}

/** Ricavi: KPI, fatturato mensile, per linea e per area, migliori clienti, stagionalità. */
export function getRevenue(filters: QuadraFilters, options?: RequestOptions): Promise<RevenueData> {
    return request(filters, buildRevenue, options)
}

/** Costi e margini: KPI, costi per categoria, margini per linea e per cliente, avvisi sui costi. */
export function getCosts(filters: QuadraFilters, options?: RequestOptions): Promise<CostsData> {
    return request(filters, buildCosts, options)
}

/** Cassa: KPI, liquidità prevista, entrate e uscite, scadenzario e fatture scadute. */
export function getCash(filters: QuadraFilters, options?: RequestOptions): Promise<CashData> {
    return request(filters, buildCash, options)
}
