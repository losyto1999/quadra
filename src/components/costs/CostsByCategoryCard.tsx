import { useReducedMotion } from '../../useMediaQuery'
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ResolvedPeriod } from '../../data/calendar'
import type { CostsData } from '../../data/types'
import { sections } from '../../routes'
import { formatEuro, formatEuroAxis, formatEuroCompact, formatPercent } from '../../utils/format'
import { translate as t } from '../../i18n/locale'
import { Card } from '../Card'
import { ChartFrame } from '../charts/ChartFrame'
import { ChartLegend } from '../charts/ChartLegend'
import { ANIMATION_MS, axisProps, COLORS, tickStyle } from '../charts/chartStyle'
import { ChartTooltip } from '../charts/ChartTooltip'
import { Skeleton } from '../Skeleton'

type Row = CostsData['byCategory'][number]

const HEIGHT = 300

function change(row: Row) {
    if (!row.previous) return ''
    const g = (row.current - row.previous) / row.previous
    return `${g >= 0 ? '+' : ''}${formatPercent(g)}`
}

function describe(rows: Row[], period: ResolvedPeriod) {
    return t('costs.byCategory.description', {
        period: period.label,
        compare: period.compareLabel,
        items: rows.map((r) => `${r.label} ${formatEuro(r.current)} (${change(r)})`).join(', '),
    })
}

/**
 * Barre orizzontali raggruppate: anno scelto e anno precedente per ogni categoria. Su barre
 * orizzontali la griglia orizzontale non serve: l'importo dell'anno scelto è scritto in fondo alla barra.
 */
export function CostsByCategoryCard({ rows, period }: { rows: Row[] | null; period: ResolvedPeriod }) {
    const reduce = useReducedMotion()

    return (
        <Card
            id={sections.costsByCategory}
            title={t('costs.byCategory.title')}
            subtitle={t('costs.byCategory.subtitle', { period: period.label, compare: period.compareLabel })}
            loading={!rows}
        >
            <ChartLegend
                items={[
                    { label: String(period.year), color: COLORS.accent },
                    { label: String(period.compareYear), color: COLORS.accentSoft },
                ]}
            />
            {rows ? (
                <ChartFrame label={describe(rows, period)} height={HEIGHT}>
                    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: HEIGHT }}>
                        <BarChart
                            data={rows}
                            layout="vertical"
                            margin={{ top: 0, right: 64, bottom: 0, left: 0 }}
                            barGap={2}
                            barCategoryGap="26%"
                            accessibilityLayer={false}
                        >
                            <XAxis type="number" {...axisProps} tick={tickStyle()} tickFormatter={formatEuroAxis} />
                            <YAxis type="category" dataKey="label" {...axisProps} tick={tickStyle()} width={104} />
                            <Tooltip
                                cursor={{ fill: COLORS.chip }}
                                isAnimationActive={false}
                                content={({ active, payload }) => {
                                    const row: Row | undefined = active ? payload?.[0]?.payload : undefined
                                    if (!row) return null
                                    return (
                                        <ChartTooltip
                                            title={row.label}
                                            rows={[
                                                { label: String(period.year), value: formatEuro(row.current), color: COLORS.accent },
                                                { label: String(period.compareYear), value: formatEuro(row.previous), color: COLORS.accentSoft },
                                            ]}
                                            footer={t('costs.byCategory.change', { change: change(row) })}
                                        />
                                    )
                                }}
                            />
                            <Bar
                                dataKey="current"
                                fill={COLORS.accent}
                                radius={[0, 6, 6, 0]}
                                maxBarSize={14}
                                isAnimationActive={!reduce}
                                animationDuration={ANIMATION_MS}
                            >
                                <LabelList
                                    dataKey="current"
                                    position="right"
                                    formatter={(value) => formatEuroCompact(Number(value))}
                                    fill={COLORS.ink}
                                    fontSize={12}
                                    fontWeight={700}
                                />
                            </Bar>
                            <Bar
                                dataKey="previous"
                                fill={COLORS.accentSoft}
                                radius={[0, 6, 6, 0]}
                                maxBarSize={14}
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
