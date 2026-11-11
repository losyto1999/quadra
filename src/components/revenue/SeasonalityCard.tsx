import { useReducedMotion } from '../../useMediaQuery'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { RevenueData } from '../../data/types'
import { sections } from '../../routes'
import { formatEuro, formatEuroAxis, monthLong } from '../../utils/format'
import { translate as t } from '../../i18n/locale'
import { Card } from '../Card'
import { ChartFrame } from '../charts/ChartFrame'
import { ChartLegend } from '../charts/ChartLegend'
import { ANIMATION_MS, axisProps, CHART_MARGIN, COLORS, gridProps, LINE_WIDTH_STRONG, PREVIOUS_DASH, tickStyle } from '../charts/chartStyle'
import { useMonthAxis } from '../charts/useMonthAxis'
import { ChartTooltip } from '../charts/ChartTooltip'
import type { SwatchShape } from '../charts/Swatch'
import { Skeleton } from '../Skeleton'

const HEIGHT = 260

/** Grigi lavanda sempre più chiari man mano che un anno è lontano da quello scelto. */
const DISTANCE_COLORS = [COLORS.accent, COLORS.heroPrev, COLORS.heroLabel, COLORS.lavenderPale]

type Seasonality = RevenueData['seasonality']

function seriesStyle(year: number, selected: number) {
    const distance = Math.abs(year - selected)
    return {
        color: DISTANCE_COLORS[Math.min(distance, DISTANCE_COLORS.length - 1)],
        width: distance === 0 ? LINE_WIDTH_STRONG : 2,
        // Come in tutti i grafici, l'anno prima di quello scelto è tratteggiato.
        dashed: year === selected - 1,
    }
}

function describe(data: Seasonality) {
    const parts = data.years.map((year) => {
        const values = data.months.map((m) => ({ month: m.month, value: m.values[year] })).filter((m) => m.value !== null)
        const max = values.reduce((a, b) => ((b.value ?? 0) > (a.value ?? 0) ? b : a), values[0])
        const min = values.reduce((a, b) => ((b.value ?? 0) < (a.value ?? 0) ? b : a), values[0])
        return t('revenue.seasonality.part', { year, max: monthLong(max.month), min: monthLong(min.month) })
    })
    return t('revenue.seasonality.description', { years: data.years.join(', '), parts: parts.join('; ') })
}

/** Il fatturato dei quattro anni sovrapposto mese per mese: si vede la forma dell'anno (e il calo di agosto). */
export function SeasonalityCard({ data }: { data: Seasonality | null }) {
    const reduce = useReducedMotion()
    const axis = useMonthAxis()
    // L'anno scelto si disegna per ultimo, sopra gli altri.
    const order = data ? [...data.years].sort((a, b) => Math.abs(b - data.selected) - Math.abs(a - data.selected)) : []

    return (
        <Card
            id={sections.seasonality}
            title={t('revenue.seasonality.title')}
            subtitle={
                data
                    ? t('revenue.seasonality.subtitle', { from: data.years[0], to: data.years[data.years.length - 1] })
                    : undefined
            }
            loading={!data}
        >
            {data ? (
                <>
                    <ChartLegend
                        items={data.years.map((year) => {
                            const s = seriesStyle(year, data.selected)
                            return { label: String(year), color: s.color, shape: (s.dashed ? 'dashed' : 'line') as SwatchShape }
                        })}
                    />
                    <ChartFrame label={describe(data)} height={HEIGHT} grow>
                        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 500, height: HEIGHT }}>
                            <LineChart data={data.months} margin={CHART_MARGIN} accessibilityLayer={false}>
                                <CartesianGrid {...gridProps()} />
                                <XAxis dataKey="label" {...axisProps} tick={axis.xTick} tickFormatter={axis.xTickFormatter} dy={6} interval={0} />
                                <YAxis {...axisProps} tick={tickStyle()} tickFormatter={formatEuroAxis} width={axis.yWidth} />
                                <Tooltip
                                    cursor={{ stroke: COLORS.track, strokeWidth: 1 }}
                                    content={({ active, payload }) => {
                                        const point: Seasonality['months'][number] | undefined = active ? payload?.[0]?.payload : undefined
                                        if (!point) return null
                                        const rows = [...data.years]
                                            .reverse()
                                            .filter((year) => point.values[year] !== null)
                                            .map((year) => {
                                                const s = seriesStyle(year, data.selected)
                                                return {
                                                    label: String(year),
                                                    value: formatEuro(point.values[year] ?? 0),
                                                    color: s.color,
                                                    shape: (s.dashed ? 'dashed' : 'line') as SwatchShape,
                                                }
                                            })
                                        return <ChartTooltip title={monthLong(point.month)} rows={rows} />
                                    }}
                                />
                                {order.map((year) => {
                                    const s = seriesStyle(year, data.selected)
                                    return (
                                        <Line
                                            key={year}
                                            dataKey={(m: Seasonality['months'][number]) => m.values[year]}
                                            name={String(year)}
                                            stroke={s.color}
                                            strokeWidth={s.width}
                                            strokeDasharray={s.dashed ? PREVIOUS_DASH : undefined}
                                            dot={false}
                                            activeDot={year === data.selected ? { r: 5, fill: s.color, stroke: COLORS.surface, strokeWidth: 2 } : false}
                                            isAnimationActive={!reduce}
                                            animationDuration={ANIMATION_MS}
                                        />
                                    )
                                })}
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartFrame>
                </>
            ) : (
                <>
                    <Skeleton width="50%" />
                    <Skeleton height={HEIGHT} radius={12} />
                </>
            )}
        </Card>
    )
}
