import { useReducedMotion } from '../../useMediaQuery'
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ResolvedPeriod } from '../../data/calendar'
import type { CashData } from '../../data/types'
import { sections } from '../../routes'
import { formatCount, formatDate, formatEuro, formatEuroCompact } from '../../utils/format'
import { translate as t } from '../../i18n/locale'
import { Card } from '../Card'
import { ChartFrame } from '../charts/ChartFrame'
import { AGING_COLORS, ANIMATION_MS, axisProps, COLORS, tickStyle } from '../charts/chartStyle'
import { ChartTooltip } from '../charts/ChartTooltip'
import { Skeleton } from '../Skeleton'

type Row = CashData['aging'][number]

const HEIGHT = 220

function describe(rows: Row[], period: ResolvedPeriod) {
    return t('cash.aging.description', {
        date: formatDate(period.snapshot),
        items: rows.map((r) => `${r.label} ${formatEuro(r.value)} (${formatCount('invoices', r.count)})`).join(', '),
    })
}

/** Scadenzario dei crediti scaduti per fasce di ritardo. La somma è il KPI "Crediti scaduti". */
export function ReceivablesAgingCard({ rows, period }: { rows: Row[] | null; period: ResolvedPeriod }) {
    const reduce = useReducedMotion()

    return (
        <Card
            id={sections.aging}
            title={t('cash.aging.title')}
            subtitle={t('cash.aging.subtitle', { date: formatDate(period.snapshot) })}
            loading={!rows}
        >
            {rows ? (
                <ChartFrame label={describe(rows, period)} height={HEIGHT}>
                    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height: HEIGHT }}>
                        <BarChart
                            data={rows}
                            layout="vertical"
                            margin={{ top: 0, right: 72, bottom: 0, left: 0 }}
                            barCategoryGap="30%"
                            accessibilityLayer={false}
                        >
                            <XAxis type="number" hide domain={[0, 'dataMax']} />
                            <YAxis type="category" dataKey="label" {...axisProps} tick={tickStyle()} width={112} />
                            <Tooltip
                                cursor={{ fill: COLORS.chip }}
                                content={({ active, payload }) => {
                                    const row: Row | undefined = active ? payload?.[0]?.payload : undefined
                                    if (!row) return null
                                    return (
                                        <ChartTooltip
                                            title={row.label}
                                            rows={[
                                                {
                                                    label: formatCount('invoices', row.count),
                                                    value: formatEuro(row.value),
                                                    color: AGING_COLORS[row.id],
                                                },
                                            ]}
                                        />
                                    )
                                }}
                            />
                            <Bar
                                dataKey="value"
                                radius={[0, 6, 6, 0]}
                                maxBarSize={22}
                                minPointSize={2}
                                isAnimationActive={!reduce}
                                animationDuration={ANIMATION_MS}
                            >
                                {rows.map((r) => (
                                    <Cell key={r.id} fill={AGING_COLORS[r.id]} />
                                ))}
                                <LabelList
                                    dataKey="value"
                                    position="right"
                                    formatter={(value) => formatEuroCompact(Number(value))}
                                    fill={COLORS.ink}
                                    fontSize={12}
                                    fontWeight={700}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartFrame>
            ) : (
                <Skeleton height={HEIGHT} radius={12} />
            )}
        </Card>
    )
}
