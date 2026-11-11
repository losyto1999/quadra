import type { ResolvedPeriod } from '../../data/calendar'
import { MARGIN_BANDS } from '../../data/rules'
import type { CostsData, LineMarginRow } from '../../data/types'
import { sections } from '../../routes'
import { formatEuro, formatPercent, formatPercentRounded } from '../../utils/format'
import { translate as t } from '../../i18n/locale'
import { Card } from '../Card'
import { Skeleton } from '../Skeleton'
import { StatusChip } from '../StatusChip'
import type { ChipTone } from '../StatusChip'
import { NAME, NUM, TABLE_SCROLL, tableClass } from '../table'

/** Colore del chip secondo la fascia del margine (data/rules.ts): positivo, ambra, negativo. */
function marginTone(margin: number): ChipTone {
    if (margin >= MARGIN_BANDS.good) return 'positive'
    if (margin >= MARGIN_BANDS.low) return 'warning'
    return 'negative'
}

function Row({ row, total }: { row: LineMarginRow; total?: boolean }) {
    return (
        <tr>
            <td className={total ? undefined : NAME}>{row.label}</td>
            <td className={NUM}>{formatEuro(row.revenue)}</td>
            <td className={NUM}>{formatEuro(row.directCost)}</td>
            <td className={NUM}>
                <StatusChip tone={marginTone(row.margin)}>{formatPercent(row.margin)}</StatusChip>
            </td>
        </tr>
    )
}

/** Fatturato, costi diretti e margine lordo per linea di prodotto. */
export function LineMarginTable({ data, period }: { data: CostsData['lineMargins'] | null; period: ResolvedPeriod }) {
    return (
        <Card id={sections.lineMargins} title={t('costs.lineMargin.title')} subtitle={period.label} loading={!data}>
            {data ? (
                <>
                    <div className={TABLE_SCROLL} role="region" aria-label={t('costs.lineMargin.region')} tabIndex={0}>
                        <table className={tableClass(true)}>
                            <caption className="sr-only">{t('costs.lineMargin.caption', { period: period.label })}</caption>
                            <thead>
                                <tr>
                                    <th scope="col">{t('costs.lineMargin.line')}</th>
                                    <th scope="col" className={NUM}>
                                        {t('costs.lineMargin.revenue')}
                                    </th>
                                    <th scope="col" className={NUM}>
                                        {t('costs.lineMargin.directCosts')}
                                    </th>
                                    <th scope="col" className={NUM}>
                                        {t('costs.lineMargin.margin')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.rows.map((row) => (
                                    <Row key={row.id} row={row} />
                                ))}
                            </tbody>
                            <tfoot>
                                <Row row={data.total} total />
                            </tfoot>
                        </table>
                    </div>
                    <p className="text-xs text-muted">
                        {t('costs.lineMargin.footnote', { good: formatPercentRounded(MARGIN_BANDS.good), low: formatPercentRounded(MARGIN_BANDS.low) })}
                    </p>
                </>
            ) : (
                <div className="flex flex-col gap-[18px] pt-2">
                    {Array.from({ length: 5 }, (_, i) => (
                        <Skeleton key={i} height={22} />
                    ))}
                </div>
            )}
        </Card>
    )
}
