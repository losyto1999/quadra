import { useId } from 'react'
import type { ReactNode } from 'react'
import { cx } from '../utils/cx'

interface CardProps {
    title?: ReactNode
    subtitle?: ReactNode
    /** Ancora per i link delle KpiCard (vedi routes.ts). */
    id?: string
    dark?: boolean
    loading?: boolean
    children?: ReactNode
}

/** Contenitore bianco (o scuro, per le card "hero") con titolo e sottotitolo facoltativi. */
export function Card({ title, subtitle, id, dark, loading, children }: CardProps) {
    const titleId = useId()
    return (
        <section
            id={id}
            aria-labelledby={title ? titleId : undefined}
            aria-busy={loading || undefined}
            className={cx(
                'flex min-w-0 scroll-mt-4 flex-col rounded-card p-6',
                // La card raggiunta da una KpiCard si evidenzia per un attimo (useScrollToHash).
                'data-highlight:animate-highlight data-highlight:outline-3 data-highlight:outline-offset-3 data-highlight:outline-accent-soft motion-reduce:data-highlight:animate-none',
                // Le card scure sono le "hero", con il numero grande: un po' più d'aria tra i blocchi.
                dark ? 'gap-[18px] bg-ink text-white' : 'gap-4 bg-surface',
            )}
        >
            {(title || subtitle) && (
                <div className="flex flex-col gap-0.5">
                    {title && (
                        <h2 id={titleId} className="text-base leading-[1.3] font-bold">
                            {title}
                        </h2>
                    )}
                    {subtitle && <p className={cx('text-label', dark ? 'text-hero-label' : 'text-muted')}>{subtitle}</p>}
                </div>
            )}
            {children}
        </section>
    )
}
