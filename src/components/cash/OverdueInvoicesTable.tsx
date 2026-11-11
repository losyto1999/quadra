import type { ResolvedPeriod } from '../../data/calendar'
import type { AgingBucketId, CashData } from '../../data/types'
import { sections } from '../../routes'
import { formatCount, formatDate, formatDays, formatEuro } from '../../utils/format'
import { translate as t } from '../../i18n/locale'
import { Card } from '../Card'
import { Skeleton } from '../Skeleton'
import { StatusChip } from '../StatusChip'
import type { ChipTone } from '../StatusChip'
import { NAME, NUM, TABLE_SCROLL, tableClass } from '../table'

/** Elenco lungo: oltre una certa altezza scorre dentro la card, con l'intestazione ferma. */
const LONG_LIST =
    'max-h-[560px] overflow-y-auto [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-1 [&_thead_th]:bg-surface [&_thead_th]:pt-0.5'

/** Il colore del chip segue la fascia di ritardo, come le barre dello scadenzario. */
const BUCKET_TONE: Record<AgingBucketId, ChipTone> = {
    b0: 'neutral',
    b30: 'accent',
    b60: 'warning',
    b90: 'negative',
}

/** Fatture scadute e non incassate alla data del periodo, dalla più in ritardo. */
export function OverdueInvoicesTable({ data, period }: { data: CashData['overdue'] | null; period: ResolvedPeriod }) {
    return (
        <Card
            id={sections.overdueInvoices}
            title={t('cash.overdue.title')}
            subtitle={
                data
                    ? t('cash.overdue.subtitle', { date: formatDate(period.snapshot), count: formatCount('invoices', data.rows.length) })
                    : t('cash.overdue.subtitleLoading', { date: formatDate(period.snapshot) })
            }
            loading={!data}
        >
            {data ? (
                data.rows.length ? (
                    <div className={`${TABLE_SCROLL} ${LONG_LIST}`} role="region" aria-label={t('cash.overdue.region')} tabIndex={0}>
                        <table className={tableClass()}>
                            <caption className="sr-only">
                                {t('cash.overdue.caption', { date: formatDate(period.snapshot) })}
                            </caption>
                            <thead>
                                <tr>
                                    <th scope="col">{t('cash.overdue.client')}</th>
                                    <th scope="col">{t('cash.overdue.number')}</th>
                                    <th scope="col" className={NUM}>
                                        {t('cash.overdue.amount')}
                                    </th>
                                    <th scope="col">{t('cash.overdue.daysLate')}</th>
                                    <th scope="col" className={NUM}>
                                        {t('cash.overdue.due')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.rows.map((row) => (
                                    <tr key={row.number}>
                                        <td className={NAME}>{row.client}</td>
                                        <td>{row.number}</td>
                                        <td className={NUM}>{formatEuro(row.amount)}</td>
                                        <td>
                                            <StatusChip tone={BUCKET_TONE[row.bucket]}>{formatDays(row.daysLate)}</StatusChip>
                                        </td>
                                        <td className={NUM}>{formatDate(row.due)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={2}>{t('cash.overdue.total')}</td>
                                    <td className={NUM}>{formatEuro(data.total)}</td>
                                    <td colSpan={2} />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-muted">{t('cash.overdue.empty')}</p>
                )
            ) : (
                <div className="flex flex-col gap-[18px] pt-2">
                    {Array.from({ length: 8 }, (_, i) => (
                        <Skeleton key={i} height={22} />
                    ))}
                </div>
            )}
        </Card>
    )
}
