import { useId } from 'react'
import { translate as t } from '../i18n/locale'
import { Skeleton } from './Skeleton'

/** Sintesi in una o due frasi, generata dai dati del periodo (data/insights.ts). */
export function InsightCard({ text }: { text: string | null }) {
    const titleId = useId()
    return (
        <section
            aria-labelledby={titleId}
            aria-busy={text === null || undefined}
            className="flex flex-col gap-2 rounded-card bg-lime px-6 py-[22px] text-ink"
        >
            <h2 id={titleId} className="text-label font-extrabold tracking-[0.06em] uppercase">
                {t('insight.title')}
            </h2>
            {text === null ? (
                <div className="flex flex-col gap-2">
                    <Skeleton tone="lime" height={14} />
                    <Skeleton tone="lime" height={14} />
                    <Skeleton tone="lime" width="60%" height={14} />
                </div>
            ) : (
                <p className="text-body leading-normal font-medium">{text}</p>
            )}
        </section>
    )
}
