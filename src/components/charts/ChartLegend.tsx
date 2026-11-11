import { cx } from '../../utils/cx'
import { Swatch } from './Swatch'
import type { SwatchShape } from './Swatch'

export interface LegendItem {
    label: string
    color: string
    shape?: SwatchShape
    opacity?: number
}

/** Legenda sopra il grafico, al posto di quella di Recharts. */
export function ChartLegend({ items, dark }: { items: LegendItem[]; dark?: boolean }) {
    return (
        <ul className={cx('flex flex-wrap gap-x-4 gap-y-1.5 text-label', dark ? 'text-hero-label' : 'text-muted')}>
            {items.map((item) => (
                <li key={item.label} className="inline-flex items-center gap-1.5">
                    <Swatch color={item.color} shape={item.shape} opacity={item.opacity} />
                    {item.label}
                </li>
            ))}
        </ul>
    )
}
