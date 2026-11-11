import { useReducedMotion } from '../../useMediaQuery'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { periodMonths } from '../../data/calendar'
import type { ResolvedPeriod } from '../../data/calendar'
import { KPI_DEFS } from '../../data/kpis'
import type { MonthPoint, OverviewData } from '../../data/types'
import { formatEuro, formatEuroAxis, formatEuroCompact, monthLong } from '../../utils/format'
import { translate as t } from '../../i18n/locale'
import { Card } from '../Card'
import { ChartFrame } from '../charts/ChartFrame'
import { ChartLegend } from '../charts/ChartLegend'
import {
    ANIMATION_MS,
    axisProps,
    CHART_MARGIN,
    COLORS,
    gridProps,
    LINE_WIDTH,
    LINE_WIDTH_STRONG,
    PREVIOUS_DASH,
    tickStyle,
} from '../charts/chartStyle'
import { useMonthAxis } from '../charts/useMonthAxis'
import { ChartTooltip } from '../charts/ChartTooltip'
import type { TooltipRow } from '../charts/ChartTooltip'
import { DeltaBadge } from '../DeltaBadge'
import { HeroHeader } from '../HeroHeader'
import { Skeleton } from '../Skeleton'

interface RevenueHeroCardProps {
    data: OverviewData['hero'] | null
    period: ResolvedPeriod
}

const CHART_HEIGHT = 250

function describe(months: MonthPoint[], period: ResolvedPeriod, value: number, previous: number) {
    const withData = months.filter((m) => m.current !== null)
    const max = withData.reduce((a, b) => ((b.current ?? 0) > (a.current ?? 0) ? b : a), withData[0])
    const min = withData.reduce((a, b) => ((b.current ?? 0) < (a.current ?? 0) ? b : a), withData[0])
    return t('overview.hero.description', {
        period: period.label,
        compareYear: period.compareYear,
        value: formatEuro(value),
        previous: formatEuro(previous),
        compare: period.compareLabel,
        max: monthLong(max.month),
        maxValue: formatEuro(max.current ?? 0),
        min: monthLong(min.month),
        minValue: formatEuro(min.current ?? 0),
    })
}

/** Card scura della Panoramica: fatturato del periodo, variazione e andamento mensile sui due anni. */
export function RevenueHeroCard({ data, period }: RevenueHeroCardProps) {
    const reduce = useReducedMotion()
    const axis = useMonthAxis({ dark: true, points: periodMonths(period.period).length })
    const def = KPI_DEFS.revenue

    return (
        <Card dark loading={!data}>
            <HeroHeader label={t('overview.hero.title', { title: period.title })} value={data ? formatEuroCompact(data.value) : null}>
                {data ? (
                    <DeltaBadge
                        tone="dark"
                        kind={def.delta}
                        polarity={def.polarity}
                        value={data.value}
                        previous={data.previous}
                        compareLabel={period.compareLabel}
                    />
                ) : (
                    <Skeleton tone="dark" width={76} height={24} radius={999} />
                )}
                <span>{t('overview.hero.versus', { compare: period.compareLabel })}</span>
            </HeroHeader>

            <ChartLegend
                dark
                items={[
                    { label: String(period.year), color: COLORS.lime, shape: 'line' },
                    { label: String(period.compareYear), color: COLORS.heroPrev, shape: 'dashed' },
                ]}
            />

            {data ? (
                <ChartFrame label={describe(data.months, period, data.value, data.previous)} height={CHART_HEIGHT}>
                    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: CHART_HEIGHT }}>
                        <ComposedChart data={data.months} margin={CHART_MARGIN} accessibilityLayer={false}>
                            <CartesianGrid {...gridProps(true)} />
                            <XAxis dataKey="label" {...axisProps} tick={axis.xTick} tickFormatter={axis.xTickFormatter} dy={6} interval={0} />
                            <YAxis
                                {...axisProps}
                                tick={tickStyle(true)}
                                tickFormatter={formatEuroAxis}
                                width={axis.yWidth}
                                domain={[0, 'auto']}
                            />
                            <Tooltip
                                cursor={{ stroke: COLORS.heroPrev, strokeWidth: 1 }}
                                content={({ active, payload }) => {
                                    const point: MonthPoint | undefined = active ? payload?.[0]?.payload : undefined
                                    if (!point) return null
                                    const rows: TooltipRow[] = []
                                    if (point.current !== null) {
                                        rows.push({
                                            label: String(period.year),
                                            value: formatEuro(point.current),
                                            color: COLORS.lime,
                                            shape: 'line',
                                        })
                                    }
                                    if (point.previous !== null) {
                                        rows.push({
                                            label: String(period.compareYear),
                                            value: formatEuro(point.previous),
                                            color: COLORS.heroPrev,
                                            shape: 'dashed',
                                        })
                                    }
                                    return <ChartTooltip title={monthLong(point.month)} rows={rows} />
                                }}
                            />
                            <Line
                                dataKey="previous"
                                stroke={COLORS.heroPrev}
                                strokeWidth={LINE_WIDTH}
                                strokeDasharray={PREVIOUS_DASH}
                                dot={false}
                                activeDot={{ r: 4, fill: COLORS.heroPrev, stroke: COLORS.ink, strokeWidth: 2 }}
                                isAnimationActive={!reduce}
                                animationDuration={ANIMATION_MS}
                            />
                            <Area
                                dataKey="current"
                                stroke={COLORS.lime}
                                strokeWidth={LINE_WIDTH_STRONG}
                                fill={COLORS.lime}
                                fillOpacity={0.12}
                                dot={false}
                                activeDot={{ r: 5, fill: COLORS.lime, stroke: COLORS.ink, strokeWidth: 2 }}
                                isAnimationActive={!reduce}
                                animationDuration={ANIMATION_MS}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartFrame>
            ) : (
                <Skeleton tone="dark" height={CHART_HEIGHT} radius={12} />
            )}
        </Card>
    )
}
