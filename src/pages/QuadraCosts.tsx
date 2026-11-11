import { getCosts } from '../api/dashboard'
import { AlertList } from '../components/AlertList'
import { KpiRow } from '../components/KpiRow'
import { LoadError } from '../components/LoadError'
import { ClientMarginBubbleCard } from '../components/costs/ClientMarginBubbleCard'
import { CostBreakdownCard } from '../components/costs/CostBreakdownCard'
import { CostsByCategoryCard } from '../components/costs/CostsByCategoryCard'
import { LineMarginTable } from '../components/costs/LineMarginTable'
import { pageName } from '../data/kpis'
import { translate as t } from '../i18n/locale'
import { sections } from '../routes'
import { useQuadraData } from '../useQuadraData'
import { useQuadraFilters } from '../useQuadraFilters'
import { useScrollToHash } from '../useScrollToHash'
import { NARROW, ROW, WIDE } from './layout'

export function QuadraCosts() {
    const { filters, period } = useQuadraFilters()
    const { data, error, retry } = useQuadraData(getCosts, filters)
    useScrollToHash(data !== null)

    if (error) {
        return (
            <>
                <h1 className="sr-only">{pageName('costs')}</h1>
                <LoadError error={error} onRetry={retry} />
            </>
        )
    }

    return (
        <>
            <h1 className="sr-only">{pageName('costs')}</h1>

            <KpiRow
                ids={['totalCosts', 'grossMargin', 'ebitda', 'personnelRatio']}
                kpis={data?.kpis ?? null}
                compareLabel={period.compareLabel}
            />

            <div className={ROW}>
                <div className={WIDE}>
                    <CostsByCategoryCard rows={data?.byCategory ?? null} period={period} />
                </div>
                <div className={NARROW}>
                    <CostBreakdownCard
                        id={sections.costsComposition}
                        title={t('costs.composition')}
                        subtitle={period.label}
                        data={data?.composition ?? null}
                        size={148}
                    />
                </div>
            </div>

            <div className={ROW}>
                <div className={NARROW}>
                    <LineMarginTable data={data?.lineMargins ?? null} period={period} />
                </div>
                <div className={WIDE}>
                    <ClientMarginBubbleCard points={data?.clients ?? null} period={period} />
                </div>
            </div>

            <AlertList id={sections.costAlerts} title={t('alerts.costTitle')} alerts={data?.alerts ?? null} placeholderRows={4} />
        </>
    )
}
