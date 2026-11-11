import type { ReactNode } from 'react'

interface ChartFrameProps {
    /** Descrizione del grafico per i lettori di schermo, costruita dai dati. */
    label: string
    /** Altezza fissa, o minima se `grow`. */
    height: number
    /** Occupa lo spazio che resta nella card (per allinearsi alla card accanto, più alta). */
    grow?: boolean
    children: ReactNode
}

/** Contenitore dei grafici: altezza fissa (assi compresi) e descrizione accessibile. */
export function ChartFrame({ label, height, grow, children }: ChartFrameProps) {
    return (
        <div
            role="img"
            aria-label={label}
            className="relative w-full min-w-0"
            style={grow ? { flex: '1 1 auto', minHeight: height } : { height }}
        >
            {children}
        </div>
    )
}
