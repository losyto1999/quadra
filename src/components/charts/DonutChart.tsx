import { useReducedMotion } from '../../useMediaQuery'
import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import type { Breakdown } from '../../data/types'
import { formatEuro, formatEuroCompact, formatPercent } from '../../utils/format'
import { translate as t } from '../../i18n/locale'
import { ANIMATION_MS, CATEGORY_COLORS, COLORS } from './chartStyle'
import { Skeleton } from '../Skeleton'
import { ChartTooltip } from './ChartTooltip'
import { Swatch } from './Swatch'

interface DonutChartProps {
    data: Breakdown
    /** Cosa rappresenta, per la descrizione accessibile ("Costi per categoria"). */
    subject: string
    centerLabel?: string
    /** Diametro in px. */
    size?: number
}

const DONUT = 'flex flex-wrap items-center gap-x-5 gap-y-4'
const LEGEND = 'flex min-w-0 flex-[1_1_140px] flex-col gap-2 text-label'

/** Ciambella con il totale al centro e la legenda (con le quote) a destra. */
export function DonutChart({ data, subject, centerLabel = t('donut.total'), size = 148 }: DonutChartProps) {
    const reduce = useReducedMotion()
    const description = t('donut.description', {
        subject,
        total: formatEuro(data.total),
        items: data.slices.map((s) => `${s.label} ${formatPercent(s.share)}`).join(', '),
    })

    return (
        <div className={DONUT}>
            <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={description}>
                <PieChart width={size} height={size} accessibilityLayer={false}>
                    <Pie
                        data={data.slices}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={size / 2 - 22}
                        outerRadius={size / 2}
                        startAngle={90}
                        endAngle={-270}
                        stroke={COLORS.surface}
                        strokeWidth={2}
                        isAnimationActive={!reduce}
                        animationDuration={ANIMATION_MS}
                    >
                        {data.slices.map((slice, i) => (
                            <Cell key={slice.id} fill={CATEGORY_COLORS[i]} />
                        ))}
                    </Pie>
                    <Tooltip
                        allowEscapeViewBox={{ x: true, y: true }}
                        wrapperStyle={{ zIndex: 2 }}
                        content={({ active, payload }) => {
                            const slice = active ? payload?.[0]?.payload : null
                            if (!slice) return null
                            const i = data.slices.findIndex((s) => s.id === slice.id)
                            return (
                                <ChartTooltip
                                    title={slice.label}
                                    rows={[
                                        {
                                            label: formatPercent(slice.share),
                                            value: formatEuro(slice.value),
                                            color: CATEGORY_COLORS[i],
                                        },
                                    ]}
                                />
                            )
                        }}
                    />
                </PieChart>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-semibold text-muted">{centerLabel}</span>
                    <span className="text-[17px] font-extrabold tracking-[-0.02em]">{formatEuroCompact(data.total)}</span>
                </div>
            </div>
            <ul className={LEGEND}>
                {data.slices.map((slice, i) => (
                    <li key={slice.id} className="flex items-center gap-2">
                        <Swatch color={CATEGORY_COLORS[i]} />
                        <span className="min-w-0 flex-1 text-ink">{slice.label}</span>
                        <span className="font-bold tabular-nums">{formatPercent(slice.share)}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

/** Segnaposto della ciambella mentre arrivano i dati. */
export function DonutSkeleton({ size = 148, rows = 5 }: { size?: number; rows?: number }) {
    return (
        <div className={DONUT}>
            <Skeleton width={size} height={size} radius={size} />
            <div className={LEGEND}>
                {Array.from({ length: rows }, (_, i) => (
                    <Skeleton key={i} height={14} />
                ))}
            </div>
        </div>
    )
}
