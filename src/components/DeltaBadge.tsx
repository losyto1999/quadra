import { computeDelta } from '../data/kpis'
import type { DeltaKind, Polarity } from '../data/types'
import { cx } from '../utils/cx'
import { describeDelta, formatDelta } from '../utils/format'
import { translate as t } from '../i18n/locale'

interface DeltaBadgeProps {
    kind: DeltaKind
    polarity: Polarity
    value: number
    previous: number | null
    /** "gen–set 2025", per il testo letto dai lettori di schermo. */
    compareLabel: string
    tone?: 'light' | 'dark'
}

/** Colori per stato; sulla card scura una variazione favorevole è lime. */
const STATES = {
    light: { good: 'bg-positive-soft text-positive', bad: 'bg-alert-red text-negative', neutral: 'bg-chip text-muted' },
    dark: { good: 'bg-lime text-ink', bad: 'bg-alert-red text-negative', neutral: 'bg-hero-grid text-white' },
}

/** Come formatDelta arrotonda: una cifra dopo la virgola per percentuali e punti, interi per giorni e conteggi. */
function isZeroWhenShown(kind: DeltaKind, delta: number) {
    const abs = Math.abs(delta)
    return kind === 'relative' || kind === 'points' ? Math.round(abs * 1000) === 0 : Math.round(abs) === 0
}

const BADGE = 'inline-flex items-center gap-1 rounded-full px-[9px] py-[3px] text-label leading-[1.35] font-bold whitespace-nowrap'

/**
 * ▲/▼ e variazione. Il colore dice se la variazione è favorevole (dipende dalla polarità della
 * metrica, non dal segno); la freccia accompagna sempre il colore.
 */
export function DeltaBadge({ kind, polarity, value, previous, compareLabel, tone = 'light' }: DeltaBadgeProps) {
    const delta = computeDelta(kind, value, previous)
    if (delta === null) {
        return (
            <span className={cx(BADGE, STATES[tone].neutral)}>
                {t('common.na')}
                <span className="sr-only">{t('delta.noneSr', { compare: compareLabel })}</span>
            </span>
        )
    }

    const text = formatDelta(kind, delta)
    // Una variazione che arrotondata vale zero non è né su né giù. Si decide dal numero, non dal testo: il
    // separatore decimale cambia con la lingua.
    const unchanged = isZeroWhenShown(kind, delta)
    const up = delta > 0
    const favorable = up === (polarity === 'up-good')
    const state = unchanged ? 'neutral' : favorable ? 'good' : 'bad'
    const spoken = unchanged
        ? t('delta.unchanged', { compare: compareLabel })
        : t('delta.spoken', {
              direction: t(up ? 'delta.up' : 'delta.down'),
              change: describeDelta(kind, delta),
              compare: compareLabel,
              tone: t(favorable ? 'delta.favorable' : 'delta.unfavorable'),
          })

    return (
        <span className={cx(BADGE, STATES[tone][state])}>
            <span aria-hidden="true">
                {unchanged ? '=' : up ? '▲' : '▼'} {text}
            </span>
            <span className="sr-only">{spoken}</span>
        </span>
    )
}
