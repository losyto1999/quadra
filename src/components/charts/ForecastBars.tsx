import { useReducedMotion } from '../../useMediaQuery'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Forecast, ForecastMonth } from '../../data/types'
import { formatEuro, formatEuroAxis, formatEuroCompact } from '../../utils/format'
import { formatList, translate as t } from '../../i18n/locale'
import { ChartFrame } from './ChartFrame'
import { ChartLegend } from './ChartLegend'
import type { LegendItem } from './ChartLegend'
import { ANIMATION_MS, axisProps, CHART_MARGIN, COLORS, gridProps, PREVIOUS_DASH, tickStyle } from './chartStyle'
import { useMonthAxis } from './useMonthAxis'
import { ChartTooltip } from './ChartTooltip'

interface ForecastBarsProps {
    forecast: Forecast
    height: number
    /** Card scura di Cassa: colonne lime e soglia minima. Altrimenti accent / accent-soft (Panoramica). */
    dark?: boolean
}

const kindLabel = (kind: ForecastMonth['kind']) => t(`forecastBars.${kind === 'scheduled' ? 'scheduled' : 'estimate'}`)

/** Liquidità prevista nei prossimi mesi: i primi due da incassi e pagamenti già noti, poi la stima. */
export function ForecastBars({ forecast, height, dark = false }: ForecastBarsProps) {
    const reduce = useReducedMotion()
    const axis = useMonthAxis({ dark, yWidth: 60 })
    const fill = (kind: ForecastMonth['kind']) =>
        dark
            ? { color: COLORS.lime, opacity: kind === 'scheduled' ? 1 : 0.4 }
            : { color: kind === 'scheduled' ? COLORS.accent : COLORS.accentSoft, opacity: 1 }

    const legend: LegendItem[] = [
        { label: kindLabel('scheduled'), ...fill('scheduled') },
        { label: kindLabel('estimate'), ...fill('estimate') },
    ]
    if (dark) legend.push({ label: t('forecastBars.threshold'), color: COLORS.heroLabel, shape: 'dashed' })

    // Asse con tacche tonde fino a poco sopra il valore più alto (e la soglia, sulla card scura).
    const top = Math.max(...forecast.months.map((m) => m.balance), dark ? forecast.threshold : 0) * 1.05
    const step = top <= 400_000 ? 100_000 : top <= 1_000_000 ? 200_000 : 500_000
    const ticks = Array.from({ length: Math.ceil(top / step) + 1 }, (_, i) => i * step)

    const scheduled = forecast.months.filter((m) => m.kind === 'scheduled').map((m) => m.label)
    const description = t(dark ? 'forecastBars.descriptionThreshold' : 'forecastBars.description', {
        range: forecast.rangeLabel,
        months: forecast.months.map((m) => `${m.label} ${formatEuroCompact(m.balance)}`).join(', '),
        scheduled: formatList(scheduled),
        min: forecast.min.longLabel,
        threshold: formatEuroCompact(forecast.threshold),
    })

    return (
        <>
            <ChartLegend dark={dark} items={legend} />
            <ChartFrame label={description} height={height}>
                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 300, height }}>
                    <BarChart data={forecast.months} margin={CHART_MARGIN} accessibilityLayer={false}>
                        <CartesianGrid {...gridProps(dark)} />
                        <XAxis dataKey="label" {...axisProps} tick={axis.xTick} dy={6} interval={0} />
                        <YAxis
                            {...axisProps}
                            tick={tickStyle(dark)}
                            tickFormatter={formatEuroAxis}
                            width={axis.yWidth}
                            domain={[0, ticks[ticks.length - 1]]}
                            ticks={ticks}
                        />
                        <Tooltip
                            cursor={{ fill: dark ? COLORS.heroGrid : COLORS.chip }}
                            content={({ active, payload }) => {
                                const month: ForecastMonth | undefined = active ? payload?.[0]?.payload : undefined
                                if (!month) return null
                                return (
                                    <ChartTooltip
                                        title={month.longLabel}
                                        rows={[{ label: kindLabel(month.kind), value: formatEuro(month.balance), ...fill(month.kind) }]}
                                    />
                                )
                            }}
                        />
                        {dark && (
                            <ReferenceLine
                                y={forecast.threshold}
                                stroke={COLORS.heroLabel}
                                strokeWidth={2}
                                strokeDasharray={PREVIOUS_DASH}
                            />
                        )}
                        <Bar
                            dataKey="balance"
                            radius={[8, 8, 0, 0]}
                            maxBarSize={40}
                            isAnimationActive={!reduce}
                            animationDuration={ANIMATION_MS}
                        >
                            {forecast.months.map((m) => {
                                const { color, opacity } = fill(m.kind)
                                return <Cell key={m.month} fill={color} fillOpacity={opacity} />
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </ChartFrame>
        </>
    )
}
