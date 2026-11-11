import type { AgingBucketId } from './types'

// Le soglie con cui la dashboard giudica i numeri, definite una volta sola. Le usano sia la logica
// (colori, avvisi, insight) sia i testi che le citano, che le ricevono come parametri: cambiandole
// qui si aggiornano chip, legende, note e frasi.

/** Fasce del margine lordo: dal 30% buono, dal 20% da tenere d'occhio, sotto il 20% basso. */
export const MARGIN_BANDS = { good: 0.3, low: 0.2 }

/** Sotto questo margine un cliente è in perdita di valore: punto rosso nel bubble chart e avviso sui costi. */
export const CLIENT_MARGIN_FLOOR = MARGIN_BANDS.low

/** Fasce dello scadenzario, in giorni di ritardo (`max` compreso); l'ultima non ha limite. */
export const AGING_BUCKETS: { id: AgingBucketId; max: number }[] = [
    { id: 'b0', max: 30 },
    { id: 'b30', max: 60 },
    { id: 'b60', max: 90 },
    { id: 'b90', max: Infinity },
]

/** Oltre la seconda fascia (più di 60 giorni) una fattura scaduta è un avviso critico. */
export const SERIOUS_OVERDUE_DAYS = AGING_BUCKETS[1].max

/** I clienti principali della concentrazione e le righe della tabella dei migliori clienti. */
export const TOP_CLIENTS = 3
export const TOP_CLIENTS_TABLE = 10

/** Soglie degli insight e degli avvisi (data/insights.ts). */
export const ALERT_RULES = {
    /** Crescita di una categoria di costo citata nell'insight e negli avvisi sui costi. */
    insightCostGrowth: 0.1,
    /** Crescita di una categoria di costo che diventa un avviso «Attenzione». */
    alertCostGrowth: 0.15,
    /** Margine lordo di una linea sotto cui scatta l'avviso. */
    lineMargin: 0.25,
    /** Quota dei primi clienti oltre cui si segnala la concentrazione. */
    concentration: 0.35,
    /** La liquidità prevista scende sotto la soglia minima × questo valore. */
    forecastNearThreshold: 1.3,
    /** Aumento dell'incidenza del personale (in punti, 0,5 pp) che merita un avviso. */
    personnelRise: 0.005,
}
