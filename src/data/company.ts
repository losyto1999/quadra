import { translate as t } from '../i18n/locale'

// L'azienda fittizia e la sua anagrafica: nomi di azienda e clienti inventati. I testi (etichette di linee,
// categorie, aree) non stanno nei dati ma in locales/*.json: qui solo id, risolti con le funzioni *Label.

export const COMPANY = {
    name: 'Officine Rossetti S.r.l.',
}

/** "dati dimostrativi", accanto al nome dell'azienda. */
export const companyNote = () => t('header.note')

/** Sotto questa liquidità l'azienda vuole intervenire: linea tratteggiata nella previsione di Cassa. */
export const CASH_THRESHOLD = 400_000

export type LineId = 'componenti' | 'assemblaggi' | 'assistenza'

export interface ProductLine {
    id: LineId
    /** Quota dei costi diretti fatta di materie prime; il resto è manodopera diretta. */
    materialsShare: number
    /** Valore medio di un ordine, per contare gli ordini. */
    orderValue: number
}

export const LINES: ProductLine[] = [
    { id: 'componenti', materialsShare: 0.72, orderValue: 4_200 },
    { id: 'assemblaggi', materialsShare: 0.6, orderValue: 11_500 },
    { id: 'assistenza', materialsShare: 0.25, orderValue: 1_600 },
]

export const lineLabel = (id: LineId) => t(`lines.${id}`)

export type CostCategoryId = 'personale' | 'materie' | 'struttura' | 'logistica' | 'marketing'

export interface CostCategory {
    id: CostCategoryId
}

/** Ordine fisso: è anche l'ordine dei colori nei grafici (accent, accent-soft, ink, lime, track). */
export const COST_CATEGORIES: CostCategory[] = [
    { id: 'personale' },
    { id: 'materie' },
    { id: 'struttura' },
    { id: 'logistica' },
    { id: 'marketing' },
]

export const categoryLabel = (id: CostCategoryId) => t(`categories.${id}`)

export type AreaId = 'nord' | 'centro' | 'sud' | 'estero'

export const AREAS: { id: AreaId }[] = [{ id: 'nord' }, { id: 'centro' }, { id: 'sud' }, { id: 'estero' }]

export const areaLabel = (id: AreaId) => t(`areas.${id}`)

/** Mix delle tre linee (componenti, assemblaggi, assistenza) per tipo di cliente. */
const MIX = {
    C: [0.76, 0.14, 0.1],
    A: [0.18, 0.72, 0.1],
    AA: [0.06, 0.9, 0.04],
    M: [0.5, 0.36, 0.14],
    S: [0.32, 0.16, 0.52],
} as const

export interface Client {
    id: number
    name: string
    area: AreaId
    /** 1, 2, 3 per i tre clienti principali, che hanno una quota fissa per anno. */
    top?: 1 | 2 | 3
    /** Peso relativo tra i clienti non principali. */
    weight: number
    /** Probabilità di ordinare in un mese (almeno un ordine a trimestre comunque). */
    frequency: number
    mix: readonly number[]
    /** Scostamento del margine rispetto a quello della linea (sconti, lavorazioni extra). */
    marginDev: number
    /** Termini di pagamento in giorni data fattura e ritardo medio con cui paga. */
    terms: number
    payDelay: number
    /** Primo e ultimo anno di attività, come scarto dall'anno corrente (0 = anno corrente). */
    from: number
    to: number
    /** Il cliente in difficoltà: smette di pagare e di ordinare (vedi generate.ts). */
    troubled?: boolean
}

type Row = [
    name: string,
    area: AreaId,
    weight: number,
    frequency: number,
    mix: keyof typeof MIX | readonly number[],
    marginDev: number,
    terms: number,
    payDelay: number,
    from?: number,
    to?: number,
]

const FIRST = -5
const LAST = 0

const ROWS: Row[] = [
    // I tre principali: il peso non conta, la quota è in TOP3_SHARE.
    ['Meccanica Valsabbia S.p.A.', 'nord', 0, 1, [0.42, 0.48, 0.1], -0.02, 60, 10],
    ['Gruppo Ferraris Impianti', 'nord', 0, 1, [0.62, 0.28, 0.1], 0.01, 60, 5],
    ['Tecnoidraulica Adriatica', 'centro', 0, 1, [0.5, 0.33, 0.17], 0, 90, 12],
    ['Edil Nord S.r.l.', 'nord', 3.3, 1, 'A', -0.03, 30, 8],
    ['Halden Maschinenbau GmbH', 'estero', 5, 1, 'C', 0.02, 60, 0],
    ['Bertolini Automazioni', 'nord', 4.6, 1, 'M', 0, 60, 15],
    ['Fonderie Galbiati', 'nord', 4.2, 1, 'C', 0.01, 90, 20],
    ['Lyon Process SAS', 'estero', 3.8, 0.9, 'M', 0.02, 60, 5],
    ['Idrotecnica Lombarda', 'nord', 3.5, 0.9, 'C', 0, 60, 25],
    ['Carpenterie Monti', 'nord', 3, 0.9, 'AA', -0.07, 60, 18],
    ['Termoelettrica Piave', 'nord', 2.8, 0.9, 'S', 0.01, 30, 10],
    ['Officine Santini', 'centro', 2.6, 0.85, 'M', -0.01, 60, 36],
    ['Brenner Anlagen AG', 'estero', 2.5, 0.8, 'C', 0.03, 30, 2],
    ['Sistemi Molinari', 'nord', 2.4, 0.85, 'A', -0.02, 60, 22],
    ['Mecsud Industrie', 'sud', 2.3, 0.8, 'M', -0.01, 90, 42],
    ['Valvole Cattaneo', 'nord', 2.2, 0.85, 'C', 0.02, 60, 12],
    ['Impianti Fabbri', 'nord', 2, 0.8, 'AA', -0.06, 60, 20],
    ['Cartiere Marchigiane Riunite', 'centro', 2, 0.8, 'S', 0, 60, 15],
    ['Costruzioni Pellegrini', 'nord', 1.9, 0.75, 'AA', -0.08, 90, 28],
    ['Brambilla Packaging', 'nord', 1.8, 0.8, 'C', 0.01, 60, 10],
    ['Elettromeccanica Sartori', 'nord', 1.7, 0.75, 'M', 0, 60, 14],
    ['Kovač Metal d.o.o.', 'estero', 1.6, 0.7, 'C', 0, 30, 6],
    ['Impianti Tiberini', 'centro', 1.6, 0.7, 'A', -0.02, 60, 24],
    ['Officine Partenopee', 'sud', 1.5, 0.7, 'M', -0.02, 90, 40],
    ['Lavorazioni Ghidini', 'nord', 1.5, 0.75, 'C', 0.02, 60, 8],
    ['Agrimec Po', 'nord', 1.4, 0.7, 'S', 0.01, 30, 12],
    ['Trasmissioni Colombo', 'nord', 1.4, 0.7, 'C', 0, 60, 16],
    ['Meccanica Aretina', 'centro', 1.3, 0.65, 'M', 0, 60, 18],
    ['Iberforja S.L.', 'estero', 1.3, 0.65, 'C', 0.01, 60, 9],
    ['Saldature Riva', 'nord', 1.2, 0.65, 'A', -0.03, 30, 20],
    ['Impianti Daunia', 'sud', 1.2, 0.6, 'AA', -0.06, 90, 38],
    ['Nastri Moretti', 'nord', 1.1, 0.65, 'C', 0.01, 60, 11],
    ['Frigotecnica Umbra', 'centro', 1.1, 0.6, 'S', 0, 60, 19],
    ['Pompe Gualtieri', 'nord', 1, 0.6, 'M', 0, 60, 13],
    ['Stampi Villa', 'nord', 1, 0.6, 'C', 0.02, 30, 7],
    ['Montaggi Ciociari', 'centro', 0.9, 0.55, 'A', -0.02, 60, 26],
    ['Carpenterie Salentine', 'sud', 0.9, 0.55, 'AA', -0.05, 90, 40],
    ['Ferramenta Industriale Bonetti', 'nord', 0.8, 0.55, 'C', 0, 30, 9],
    ['Gru e Sollevamenti Tosi', 'nord', 0.8, 0.5, 'M', 0.01, 60, 15],
    ['Laminati Bergamaschi', 'nord', 0.8, 0.5, 'C', 0, 60, 10],
    ['Utensili Rinaldi', 'nord', 0.7, 0.5, 'C', 0.02, 30, 5],
    ['Agroindustria Sibari', 'sud', 0.7, 0.5, 'S', 0, 60, 28],
    ['Arredi Metallici Fanelli', 'centro', 0.6, 0.45, 'A', -0.01, 60, 17],
    ['Termica Sabina', 'centro', 0.6, 0.45, 'S', 0.01, 30, 14],
    // Nuovi clienti: dal 2025 e dal 2026.
    ['Robotica Cereda', 'nord', 1.6, 0.8, 'M', 0.02, 60, 6, -1],
    ['Delta Mechanics B.V.', 'estero', 1.5, 0.75, 'C', 0.02, 60, 4, -1],
    ['Meccatronica Franzoni', 'nord', 1.2, 0.8, 'M', 0.01, 60, 10, 0],
    ['Officine Zanella', 'nord', 0.9, 0.7, 'C', 0, 30, 8, 0],
    ['Rossi & Bassi Macchine', 'nord', 0.7, 0.6, 'M', 0, 60, 20, 0],
    // Clienti persi: l'ultimo anno di attività è il 2023, il 2024 o il 2025.
    ['Officine Lario', 'nord', 1.4, 0.7, 'C', 0, 60, 14, FIRST, -3],
    ['Termoidraulica Volpi', 'nord', 1, 0.6, 'A', -0.02, 60, 22, FIRST, -2],
    ['Ceramiche Valdelsa', 'centro', 1.1, 0.6, 'S', 0, 60, 18, FIRST, -2],
    ['Navalmeccanica Stabia', 'sud', 1.3, 0.6, 'M', -0.01, 90, 30, FIRST, -1],
]

export const CLIENTS: Client[] = ROWS.map(
    ([name, area, weight, frequency, mix, marginDev, terms, payDelay, from = FIRST, to = LAST], i) => ({
        id: i,
        name,
        area,
        top: i < 3 ? ((i + 1) as 1 | 2 | 3) : undefined,
        weight,
        frequency,
        mix: typeof mix === 'string' ? MIX[mix] : mix,
        marginDev,
        terms,
        payDelay,
        from,
        to,
        troubled: name === 'Edil Nord S.r.l.',
    }),
)

// Obiettivi per anno, indicizzati per scarto dall'anno corrente (-5 = mesi di avviamento … 0 = anno corrente).
const byOffset = (values: number[]) => (offset: number) => values[Math.min(Math.max(offset + 5, 0), values.length - 1)]

/** Fatturato annuo di riferimento: circa 5 M€, +6% nell'anno corrente. */
export const annualRevenue = byOffset([4_300_000, 4_450_000, 4_600_000, 4_740_000, 4_860_000, 5_170_000])
/** Quota dei primi tre clienti, che sale fino al 41%. */
export const top3Share = byOffset([0.35, 0.35, 0.36, 0.38, 0.39, 0.41])
/** Come si dividono la quota i primi tre. */
export const TOP3_SPLIT = [17, 13, 11]

/** Margine lordo per linea: gli Assemblaggi su misura scendono al 21% nell'anno corrente. */
export const LINE_MARGIN: Record<LineId, (offset: number) => number> = {
    componenti: byOffset([0.39, 0.39, 0.39, 0.4, 0.4, 0.4]),
    assemblaggi: byOffset([0.27, 0.27, 0.26, 0.25, 0.24, 0.21]),
    assistenza: byOffset([0.44, 0.44, 0.45, 0.45, 0.45, 0.46]),
}

/** Mese della chiusura estiva (0 = gennaio): agosto. */
export const SUMMER_CLOSURE_MONTH = 7

/** Stagionalità del fatturato (media 1): agosto a 0,62, cioè circa −40% sulla media degli altri mesi. */
export const SEASONALITY = [0.93, 0.99, 1.07, 1.03, 1.09, 1.07, 1.08, 0.62, 1.05, 1.09, 1.06, 0.92]

/** Aumento della logistica nell'anno corrente rispetto allo stesso mese dell'anno prima. */
export const LOGISTICS_GROWTH = 0.22
