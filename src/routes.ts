// Percorsi dell'app, relativi al `basename` del router (su GitHub Pages `/quadra/`, vedi main.tsx).

export const paths = {
    overview: '/',
    revenue: '/ricavi',
    costs: '/costi',
    cash: '/cassa',
}

export type PageKey = keyof typeof paths

/** Id delle card che approfondiscono una metrica: le KpiCard ci portano con l'hash. */
export const sections = {
    revenueMonthly: 'fatturato-mensile',
    revenueByLine: 'ricavi-linea',
    revenueByArea: 'ricavi-area',
    topClients: 'clienti',
    seasonality: 'stagionalita',
    costsByCategory: 'costi-categoria',
    costsComposition: 'composizione',
    lineMargins: 'margini-linea',
    clientMargins: 'margine-clienti',
    costAlerts: 'avvisi-costi',
    cashForecast: 'previsione',
    cashFlows: 'entrate-uscite',
    aging: 'scadenzario',
    overdueInvoices: 'fatture-scadute',
} as const

export type SectionId = (typeof sections)[keyof typeof sections]
