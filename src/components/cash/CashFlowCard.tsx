import { useReducedMotion } from '../../useMediaQuery'
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ResolvedPeriod } from '../../data/calendar'
import type { CashData } from '../../data/types'
import { sections } from '../../routes'
import { formatEuro, formatEuroAxis, monthLong } from '../../utils/format'
import { translate as t } from '../../i18n/locale'
import { Card } from '../Card'
import { ChartFrame } from '../charts/ChartFrame'
import { ChartLegend } from '../charts/ChartLegend'
import { ANIMATION_MS, axisProps, CHART_MARGIN, COLORS, gridProps, LINE_WIDTH, tickStyle } from '../charts/chartStyle'
import { useMonthAxis } from '../charts/useMonthAxis'
import { ChartTooltip } from '../charts/ChartTooltip'
import { Skeleton } from '../Skeleton'

type Row = CashData['flows'][number]

const HEIGHT = 300

function describe(rows: Row[], period: ResolvedPeriod) {
    const inflow = rows.reduce((s, r) => s + r.inflow, 0)
    const outflow = rows.reduce((s, r) => s + r.outflow, 0)
    const worst = rows.reduce((a, b) => (b.net < a.net ? b : a), rows[0])
    return t('cash.flows.description', {
        period: period.label,
        inflow: formatEuro(inflow),
        outflow: formatEuro(outflow),
        net: formatEuro(inflow - outflow),
        month: monthLong(worst.month),
        worst: formatEuro(worst.net),
    })
}

/** Entrate e uscite affiancate, con il saldo del mese come linea lime bordata di scuro. */
export function CashFlowCard({ rows, period }: { rows: Row[] | null; period: ResolvedPeriod }) {
    const reduce = useReducedMotion()
    const axis = useMonthAxis({ points: period.months.length })
    const animation = { isAnimationActive: !reduce, animationDuration: ANIMATION_MS }

    return (
        <Card id={sections.cashFlows} title={t('cash.flows.title')} subtitle={period.label} loading={!rows}>
            <ChartLegend
                items={[
                    { label: t('cash.flows.inflows'), color: COLORS.accent },
                    { label: t('cash.flows.outflows'), color: COLORS.ink },
                    { label: t('cash.flows.net'), color: COLORS.lime, shape: 'line' },
                ]}
            />
            {rows ? (
                <ChartFrame label={describe(rows, period)} height={HEIGHT}>
                    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: HEIGHT }}>
                        <ComposedChart data={rows} margin={CHART_MARGIN} barGap={2} barCategoryGap="26%" accessibilityLayer={false}>
                            <CartesianGrid {...gridProps()} />
                            <XAxis dataKey="label" {...axisProps} tick={axis.xTick} tickFormatter={axis.xTickFormatter} dy={6} interval={0} />
                            <YAxis {...axisProps} tick={tickStyle()} tickFormatter={formatEuroAxis} width={axis.yWidth} />
                            <ReferenceLine y={0} stroke={COLORS.muted} strokeWidth={1} />
                            <Tooltip
                                cursor={{ fill: COLORS.chip }}
                                content={({ active, payload }) => {
                                    const row: Row | undefined = active ? payload?.[0]?.payload : undefined
                                    if (!row) return null
                                    return (
                                        <ChartTooltip
                                            title={monthLong(row.month)}
                                            rows={[
                                                { label: t('cash.flows.inflowsLower'), value: formatEuro(row.inflow), color: COLORS.accent },
                                                { label: t('cash.flows.outflowsLower'), value: formatEuro(row.outflow), color: COLORS.ink },
                                                { label: t('cash.flows.netLower'), value: formatEuro(row.net), color: COLORS.lime, shape: 'line' },
                                            ]}
                                        />
                                    )
                                }}
                            />
                            <Bar dataKey="inflow" fill={COLORS.accent} radius={[6, 6, 0, 0]} maxBarSize={18} {...animation} />
                            <Bar dataKey="outflow" fill={COLORS.ink} radius={[6, 6, 0, 0]} maxBarSize={18} {...animation} />
                            {/* Il bordo scuro è una seconda linea più larga, sotto quella lime. */}
                            <Line
                                dataKey="net"
                                stroke={COLORS.ink}
                                strokeWidth={LINE_WIDTH + 3}
                                dot={false}
                                activeDot={false}
                                tooltipType="none"
                                legendType="none"
                                {...animation}
                            />
                            <Line
                                dataKey="net"
                                stroke={COLORS.lime}
                                strokeWidth={LINE_WIDTH}
                                dot={{ r: 4, fill: COLORS.lime, stroke: COLORS.ink, strokeWidth: 2 }}
                                activeDot={{ r: 5, fill: COLORS.lime, stroke: COLORS.ink, strokeWidth: 2 }}
                                {...animation}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartFrame>
            ) : (
                <Skeleton height={HEIGHT} radius={12} />
            )}
        </Card>
    )
}
