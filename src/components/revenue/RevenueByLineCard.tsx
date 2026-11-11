import { useReducedMotion } from '../../useMediaQuery'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ResolvedPeriod } from '../../data/calendar'
import { LINES, lineLabel } from '../../data/company'
import type { RevenueData } from '../../data/types'
import { sections } from '../../routes'
import { formatEuro, formatEuroAxis, monthLong } from '../../utils/format'
import { translate as t } from '../../i18n/locale'
import { Card } from '../Card'
import { ChartFrame } from '../charts/ChartFrame'
import { ChartLegend } from '../charts/ChartLegend'
import { ANIMATION_MS, axisProps, CHART_MARGIN, COLORS, gridProps, LINE_COLORS, tickStyle } from '../charts/chartStyle'
import { useMonthAxis } from '../charts/useMonthAxis'
import { ChartTooltip } from '../charts/ChartTooltip'
import { Skeleton } from '../Skeleton'

const HEIGHT = 260

type Row = RevenueData['byLine'][number]

function describe(rows: Row[], period: ResolvedPeriod) {
    const totals = LINES.map((l) => `${lineLabel(l.id)} ${formatEuro(rows.reduce((s, r) => s + r[l.id], 0))}`)
    return t('revenue.byLine.description', { period: period.label, items: totals.join(', ') })
}

/** Ricavi del periodo mese per mese, impilati per linea di prodotto. */
export function RevenueByLineCard({ rows, period }: { rows: Row[] | null; period: ResolvedPeriod }) {
    const reduce = useReducedMotion()
    const axis = useMonthAxis({ points: period.months.length })

    return (
        <Card id={sections.revenueByLine} title={t('revenue.byLine.title')} subtitle={period.label} loading={!rows}>
            <ChartLegend items={LINES.map((l) => ({ label: lineLabel(l.id), color: LINE_COLORS[l.id] }))} />
            {rows ? (
                <ChartFrame label={describe(rows, period)} height={HEIGHT}>
                    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 500, height: HEIGHT }}>
                        <BarChart data={rows} margin={CHART_MARGIN} barCategoryGap="28%" accessibilityLayer={false}>
                            <CartesianGrid {...gridProps()} />
                            <XAxis dataKey="label" {...axisProps} tick={axis.xTick} tickFormatter={axis.xTickFormatter} dy={6} interval={0} />
                            <YAxis {...axisProps} tick={tickStyle()} tickFormatter={formatEuroAxis} width={axis.yWidth} />
                            <Tooltip
                                cursor={{ fill: COLORS.chip }}
                                content={({ active, payload }) => {
                                    const row: Row | undefined = active ? payload?.[0]?.payload : undefined
                                    if (!row) return null
                                    const total = LINES.reduce((s, l) => s + row[l.id], 0)
                                    return (
                                        <ChartTooltip
                                            title={monthLong(row.month)}
                                            rows={[...LINES]
                                                .reverse()
                                                .map((l) => ({ label: lineLabel(l.id), value: formatEuro(row[l.id]), color: LINE_COLORS[l.id] }))}
                                            footer={t('revenue.byLine.total', { value: formatEuro(total) })}
                                        />
                                    )
                                }}
                            />
                            {/* Il bordo color superficie separa i segmenti con 2px di vuoto; il raggio va solo in cima. */}
                            {LINES.map((l, i) => (
                                <Bar
                                    key={l.id}
                                    dataKey={l.id}
                                    stackId="lines"
                                    fill={LINE_COLORS[l.id]}
                                    stroke={COLORS.surface}
                                    strokeWidth={2}
                                    radius={i === LINES.length - 1 ? [6, 6, 0, 0] : 0}
                                    maxBarSize={28}
                                    isAnimationActive={!reduce}
                                    animationDuration={ANIMATION_MS}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </ChartFrame>
            ) : (
                <Skeleton height={HEIGHT} radius={12} />
            )}
        </Card>
    )
}
