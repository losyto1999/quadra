import { Swatch } from './Swatch'
import type { SwatchShape } from './Swatch'

export interface TooltipRow {
    label: string
    value: string
    color?: string
    shape?: SwatchShape
    opacity?: number
}

/** Tooltip dei grafici: card bianca, valore in evidenza e serie accanto. */
export function ChartTooltip({ title, rows, footer }: { title: string; rows: TooltipRow[]; footer?: string }) {
    return (
        <div className="min-w-[150px] rounded-control border border-track bg-surface px-3 py-2.5 text-label leading-[1.4] text-ink">
            <p className="mb-1.5 text-xs font-semibold text-muted">{title}</p>
            <ul className="flex flex-col gap-1">
                {rows.map((row) => (
                    <li key={row.label} className="flex items-center gap-2">
                        {row.color && <Swatch color={row.color} shape={row.shape} opacity={row.opacity} />}
                        <span className="font-bold tabular-nums">{row.value}</span>
                        <span className="text-muted">{row.label}</span>
                    </li>
                ))}
            </ul>
            {footer && <p className="mt-1.5 border-t border-track pt-1.5 text-xs text-muted">{footer}</p>}
        </div>
    )
}
