import type { ResolvedPeriod } from '../../data/calendar'
import { KPI_DEFS } from '../../data/kpis'
import { TOP_CLIENTS_TABLE } from '../../data/rules'
import type { TopClientRow } from '../../data/types'
import { sections } from '../../routes'
import { formatDate, formatEuro, formatPercent } from '../../utils/format'
import { translate as t } from '../../i18n/locale'
import { Card } from '../Card'
import { DeltaBadge } from '../DeltaBadge'
import { Skeleton } from '../Skeleton'
import { StatusChip } from '../StatusChip'
import { NAME, NUM, TABLE_SCROLL, tableClass } from '../table'

/** I clienti con più fatturato nel periodo (TOP_CLIENTS_TABLE, i primi dieci). */
export function TopClientsTable({ rows, period }: { rows: TopClientRow[] | null; period: ResolvedPeriod }) {
    const def = KPI_DEFS.revenue
    // Le barre sono in scala con il primo cliente, così le differenze tra i clienti si vedono; la quota
    // esatta è scritta accanto.
    const maxShare = rows?.[0]?.share ?? 1

    return (
        <Card id={sections.topClients} title={t('revenue.topClients.title', { n: TOP_CLIENTS_TABLE })} subtitle={period.label} loading={!rows}>
            {rows ? (
                <div className={TABLE_SCROLL} role="region" aria-label={t('revenue.topClients.region', { n: TOP_CLIENTS_TABLE })} tabIndex={0}>
                    <table className={tableClass()}>
                        <caption className="sr-only">
                            {t('revenue.topClients.caption', { n: TOP_CLIENTS_TABLE, period: period.label, compare: period.compareLabel })}
                        </caption>
                        <thead>
                            <tr>
                                <th scope="col">{t('revenue.topClients.client')}</th>
                                <th scope="col" className={NUM}>
                                    {t('revenue.topClients.revenue')}
                                </th>
                                <th scope="col">{t('revenue.topClients.share')}</th>
                                <th scope="col">{t('revenue.topClients.change')}</th>
                                <th scope="col" className={NUM}>
                                    {t('revenue.topClients.lastInvoice')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id}>
                                    <td className={NAME}>{row.name}</td>
                                    <td className={NUM}>{formatEuro(row.revenue)}</td>
                                    <td>
                                        <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
                                            <span className="block h-1.5 w-[72px] overflow-hidden rounded-full bg-track" aria-hidden="true">
                                                <span className="block h-full rounded-full bg-accent" style={{ width: `${(row.share / maxShare) * 100}%` }} />
                                            </span>
                                            {formatPercent(row.share)}
                                        </span>
                                    </td>
                                    <td>
                                        {row.previous > 0 ? (
                                            <DeltaBadge
                                                kind={def.delta}
                                                polarity={def.polarity}
                                                value={row.revenue}
                                                previous={row.previous}
                                                compareLabel={period.compareLabel}
                                            />
                                        ) : (
                                            <StatusChip tone="accent">{t('revenue.topClients.new')}</StatusChip>
                                        )}
                                    </td>
                                    <td className={NUM}>{formatDate(row.lastInvoice)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex flex-col gap-[18px] pt-2">
                    {Array.from({ length: TOP_CLIENTS_TABLE }, (_, i) => (
                        <Skeleton key={i} height={22} />
                    ))}
                </div>
            )}
        </Card>
    )
}
