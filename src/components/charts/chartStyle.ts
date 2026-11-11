import type { LineId } from '../../data/company'
import type { AgingBucketId } from '../../data/types'

// Stile comune dei grafici (Recharts legge le variabili CSS di quadra.css negli attributi SVG):
// griglia solo orizzontale color track, niente linee d'asse, linee spesse, anno precedente tratteggiato.

export const COLORS = {
    accent: 'var(--q-accent)',
    accentSoft: 'var(--q-accent-soft)',
    ink: 'var(--q-ink)',
    lime: 'var(--q-lime)',
    track: 'var(--q-track)',
    muted: 'var(--q-muted)',
    surface: 'var(--q-surface)',
    chip: 'var(--q-chip)',
    negative: 'var(--q-negative)',
    amber: 'var(--q-amber)',
    heroPrev: 'var(--q-hero-prev)',
    heroGrid: 'var(--q-hero-grid)',
    heroLabel: 'var(--q-hero-label)',
    lavenderPale: 'var(--q-lavender-pale)',
}

/** Sequenza fissa per le categorie (costi, aree): il colore segue la categoria, non il suo peso. */
export const CATEGORY_COLORS = [COLORS.accent, COLORS.accentSoft, COLORS.ink, COLORS.lime, COLORS.track]

export const LINE_COLORS: Record<LineId, string> = {
    componenti: COLORS.accent,
    assemblaggi: COLORS.accentSoft,
    assistenza: COLORS.ink,
}

/** Scadenzario: gravità crescente con il ritardo. */
export const AGING_COLORS: Record<AgingBucketId, string> = {
    b0: COLORS.track,
    b30: COLORS.accentSoft,
    b60: COLORS.amber,
    b90: COLORS.negative,
}

export const LINE_WIDTH = 3
export const LINE_WIDTH_STRONG = 3.5
export const PREVIOUS_DASH = '6 5'
export const ANIMATION_MS = 600

export const axisProps = { axisLine: false, tickLine: false } as const

export const tickStyle = (dark = false) => ({ fill: dark ? COLORS.heroLabel : COLORS.muted, fontSize: 12 })

export const gridProps = (dark = false) => ({ vertical: false, stroke: dark ? COLORS.heroGrid : COLORS.track })

/** Margini interni comuni: un po' d'aria in alto per l'ultima etichetta dell'asse Y. */
export const CHART_MARGIN = { top: 8, right: 4, bottom: 0, left: 0 }
