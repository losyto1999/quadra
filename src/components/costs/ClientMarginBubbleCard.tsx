import { useReducedMotion } from '../../useMediaQuery'
import { CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'
import type { ResolvedPeriod } from '../../data/calendar'
import { CLIENT_MARGIN_FLOOR } from '../../data/rules'
import type { ClientMarginPoint } from '../../data/types'
import { sections } from '../../routes'
import { formatEuro, formatEuroAxis, formatNumber, formatPercent, formatPercentRounded } from '../../utils/format'
import { translate as t } from '../../i18n/locale'
import { Card } from '../Card'
import { ChartFrame } from '../charts/ChartFrame'
import { ChartLegend } from '../charts/ChartLegend'
import { ANIMATION_MS, axisProps, CHART_MARGIN, COLORS, gridProps, tickStyle } from '../charts/chartStyle'
import { ChartTooltip } from '../charts/ChartTooltip'
import { Skeleton } from '../Skeleton'

const HEIGHT = 320
/** Il fatturato va da poche migliaia a centinaia di migliaia di euro: in scala logaritmica i clienti piccoli non si ammassano. */
const REVENUE_TICKS = [5_000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000]

const colorOf = (point: ClientMarginPoint) => (point.margin < CLIENT_MARGIN_FLOOR ? COLORS.negative : COLORS.accent)

function describe(points: ClientMarginPoint[], period: ResolvedPeriod) {
    const low = points.filter((p) => p.margin < CLIENT_MARGIN_FLOOR)
    const floor = formatPercentRounded(CLIENT_MARGIN_FLOOR)
    return (
        t('costs.bubble.description', { count: points.length, period: period.label }) +
        (low.length
            ? t('costs.bubble.lowList', {
                  floor,
                  list: low.map((p) => `${p.name} (${formatPercent(p.margin)}, ${formatEuro(p.revenue)})`).join(', '),
              })
            : t('costs.bubble.none', { floor }))
    )
}

/** Bubble chart: fatturato sull'asse X, margine % sull'asse Y, dimensione = numero di ordini. */
export function ClientMarginBubbleCard({ points, period }: { points: ClientMarginPoint[] | null; period: ResolvedPeriod }) {
    const reduce = useReducedMotion()

    let xDomain: [number, number] = [1, 10]
    let yDomain: [number, number] = [0, 1]
    const yTicks: number[] = []
    if (points?.length) {
        const revenues = points.map((p) => p.revenue)
        const margins = points.map((p) => p.margin)
        xDomain = [Math.min(...revenues) * 0.75, Math.max(...revenues) * 1.35]
        yDomain = [Math.floor((Math.min(...margins) - 0.02) * 20) / 20, Math.ceil((Math.max(...margins) + 0.02) * 20) / 20]
        for (let t = yDomain[0]; t <= yDomain[1] + 1e-9; t += 0.05) yTicks.push(Math.round(t * 100) / 100)
    }
    const xTicks = REVENUE_TICKS.filter((t) => t >= xDomain[0] && t <= xDomain[1])

    return (
        <Card
            id={sections.clientMargins}
            title={t('costs.bubble.title')}
            subtitle={t('costs.bubble.subtitle', { period: period.label })}
            loading={!points}
        >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <ChartLegend
                    items={[
                        { label: t('costs.bubble.legendHigh', { floor: formatPercentRounded(CLIENT_MARGIN_FLOOR) }), color: COLORS.accent, shape: 'dot' },
                        { label: t('costs.bubble.legendLow', { floor: formatPercentRounded(CLIENT_MARGIN_FLOOR) }), color: COLORS.negative, shape: 'dot' },
                    ]}
                />
                <span className="text-label text-muted">{t('costs.bubble.size')}</span>
            </div>
            {points ? (
                <ChartFrame label={describe(points, period)} height={HEIGHT}>
                    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: HEIGHT }}>
                        <ScatterChart margin={{ ...CHART_MARGIN, right: 16 }} accessibilityLayer={false}>
                            <CartesianGrid {...gridProps()} />
                            <XAxis
                                type="number"
                                dataKey="revenue"
                                scale="log"
                                domain={xDomain}
                                ticks={xTicks}
                                allowDataOverflow
                                {...axisProps}
                                tick={tickStyle()}
                                tickFormatter={formatEuroAxis}
                                dy={6}
                            />
                            <YAxis
                                type="number"
                                dataKey="margin"
                                domain={yDomain}
                                ticks={yTicks}
                                {...axisProps}
                                tick={tickStyle()}
                                tickFormatter={(v: number) => formatPercentRounded(v)}
                                width={44}
                            />
                            <ZAxis type="number" dataKey="orders" range={[50, 650]} />
                            <Tooltip
                                cursor={false}
                                // Tra un punto e l'altro il tooltip si nasconde: con la transizione di posizione di Recharts
                                // ogni nuovo hover farebbe ripartire lo scivolamento dal punto precedente.
                                isAnimationActive={false}
                                content={({ active, payload }) => {
                                    const point: ClientMarginPoint | undefined = active ? payload?.[0]?.payload : undefined
                                    if (!point) return null
                                    return (
                                        <ChartTooltip
                                            title={point.name}
                                            rows={[
                                                { label: t('costs.bubble.revenue'), value: formatEuro(point.revenue), color: colorOf(point), shape: 'dot' },
                                                { label: t('costs.bubble.margin'), value: formatPercent(point.margin) },
                                                { label: t('costs.bubble.orders'), value: formatNumber(point.orders) },
                                            ]}
                                        />
                                    )
                                }}
                            />
                            <Scatter data={points} isAnimationActive={!reduce} animationDuration={ANIMATION_MS}>
                                {points.map((p) => (
                                    <Cell key={p.id} fill={colorOf(p)} fillOpacity={0.75} stroke={COLORS.surface} strokeWidth={1.5} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </ChartFrame>
            ) : (
                <Skeleton height={HEIGHT} radius={12} />
            )}
        </Card>
    )
}
