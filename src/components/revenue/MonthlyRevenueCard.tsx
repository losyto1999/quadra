import { useReducedMotion } from '../../useMediaQuery'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { periodMonths } from '../../data/calendar'
import type { ResolvedPeriod } from '../../data/calendar'
import type { MonthPoint } from '../../data/types'
import { sections } from '../../routes'
import { formatEuro, formatEuroAxis, monthLong } from '../../utils/format'
import { translate as t } from '../../i18n/locale'
import { Card } from '../Card'
import { ChartFrame } from '../charts/ChartFrame'
import { ChartLegend } from '../charts/ChartLegend'
import { useMonthAxis } from '../charts/useMonthAxis'
import { ANIMATION_MS, axisProps, CHART_MARGIN, COLORS, gridProps, tickStyle } from '../charts/chartStyle'
import { ChartTooltip } from '../charts/ChartTooltip'
import type { TooltipRow } from '../charts/ChartTooltip'
import { Skeleton } from '../Skeleton'

const HEIGHT = 280
function describe(months: MonthPoint[], period: ResolvedPeriod) {
    const parts = months
        .filter((m) => m.current !== null || m.previous !== null)
        .map((m) => {
            const current = m.current === null ? t('common.na') : formatEuro(m.current)
            const previous = m.previous === null ? t('common.na') : formatEuro(m.previous)
            return t('revenue.monthly.part', { month: monthLong(m.month), current, previous })
        })
    return t('revenue.monthly.description', { year: period.year, compareYear: period.compareYear, parts: parts.join('; ') })
}

/** Fatturato mese per mese, anno scelto contro anno precedente, a barre affiancate. */
export function MonthlyRevenueCard({ months, period }: { months: MonthPoint[] | null; period: ResolvedPeriod }) {
    const reduce = useReducedMotion()
    const axis = useMonthAxis({ points: periodMonths(period.period).length })

    return (
        <Card
            id={sections.revenueMonthly}
            title={t('revenue.monthly.title')}
            subtitle={t('revenue.monthly.subtitle', { period: period.label, compare: period.compareLabel })}
            loading={!months}
        >
            <ChartLegend
                items={[
                    { label: String(period.year), color: COLORS.accent },
                    { label: String(period.compareYear), color: COLORS.accentSoft },
                ]}
            />
            {months ? (
                <ChartFrame label={describe(months, period)} height={HEIGHT}>
                    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: HEIGHT }}>
                        <BarChart data={months} margin={CHART_MARGIN} barGap={2} barCategoryGap="24%" accessibilityLayer={false}>
                            <CartesianGrid {...gridProps()} />
                            <XAxis
                                dataKey="label"
                                {...axisProps}
                                tick={axis.xTick}
                                tickFormatter={axis.xTickFormatter}
                                dy={6}
                                interval={0}
                            />
                            <YAxis {...axisProps} tick={tickStyle()} tickFormatter={formatEuroAxis} width={axis.yWidth} />
                            <Tooltip
                                cursor={{ fill: COLORS.chip }}
                                content={({ active, payload }) => {
                                    const point: MonthPoint | undefined = active ? payload?.[0]?.payload : undefined
                                    if (!point) return null
                                    const rows: TooltipRow[] = []
                                    if (point.current !== null) {
                                        rows.push({ label: String(period.year), value: formatEuro(point.current), color: COLORS.accent })
                                    }
                                    if (point.previous !== null) {
                                        rows.push({ label: String(period.compareYear), value: formatEuro(point.previous), color: COLORS.accentSoft })
                                    }
                                    return <ChartTooltip title={monthLong(point.month)} rows={rows} />
                                }}
                            />
                            <Bar
                                dataKey="current"
                                fill={COLORS.accent}
                                radius={[6, 6, 0, 0]}
                                maxBarSize={20}
                                isAnimationActive={!reduce}
                                animationDuration={ANIMATION_MS}
                            />
                            <Bar
                                dataKey="previous"
                                fill={COLORS.accentSoft}
                                radius={[6, 6, 0, 0]}
                                maxBarSize={20}
                                isAnimationActive={!reduce}
                                animationDuration={ANIMATION_MS}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartFrame>
            ) : (
                <Skeleton height={HEIGHT} radius={12} />
            )}
        </Card>
    )
}
