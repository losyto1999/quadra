import type { ReactNode } from 'react'
import { Skeleton } from './Skeleton'

interface HeroHeaderProps {
    /** Titolo della card (h2). */
    label: ReactNode
    /** Il numero grande; null mentre i dati arrivano. */
    value: string | null
    /** Riga sotto il numero (variazione, confronto). */
    children?: ReactNode
}

/** Intestazione delle card scure "hero" (Panoramica e Cassa): etichetta, numero grande, riga sotto. */
export function HeroHeader({ label, value, children }: HeroHeaderProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <h2 className="text-sm font-semibold text-hero-label">{label}</h2>
            {value === null ? (
                <Skeleton tone="dark" width={230} height={48} />
            ) : (
                <p className="text-hero leading-[1.05] font-extrabold tracking-[-0.02em] text-white">{value}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-label text-hero-label">{children}</div>
        </div>
    )
}
