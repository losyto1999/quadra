import type { ResolvedPeriod } from '../../data/calendar'
import type { AreaId } from '../../data/company'
import type { Breakdown } from '../../data/types'
import { sections } from '../../routes'
import { translate as t } from '../../i18n/locale'
import { Card } from '../Card'
import { DonutChart, DonutSkeleton } from '../charts/DonutChart'

const SIZE = 148

/** Ricavi del periodo per area geografica dei clienti. */
export function RevenueByAreaCard({ data, period }: { data: Breakdown<AreaId> | null; period: ResolvedPeriod }) {
    return (
        <Card id={sections.revenueByArea} title={t('revenue.byArea')} subtitle={period.label} loading={!data}>
            {data ? (
                <DonutChart data={data} subject={t('revenue.byArea')} size={SIZE} />
            ) : (
                <DonutSkeleton size={SIZE} rows={4} />
            )}
        </Card>
    )
}
