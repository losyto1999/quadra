import type { ReactNode } from 'react'

export type ChipTone = 'positive' | 'warning' | 'negative' | 'accent' | 'neutral'

const TONES: Record<ChipTone, string> = {
    positive: 'bg-positive-soft text-positive',
    warning: 'bg-alert-amber text-amber-ink',
    negative: 'bg-alert-red text-negative',
    accent: 'bg-chip text-accent',
    neutral: 'bg-chip text-ink',
}

/** Valore in una pillola colorata secondo la sua fascia (margine, giorni di ritardo). */
export function StatusChip({ tone, children }: { tone: ChipTone; children: ReactNode }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-[3px] text-label leading-[1.35] font-bold whitespace-nowrap ${TONES[tone]}`}
        >
            {children}
        </span>
    )
}
