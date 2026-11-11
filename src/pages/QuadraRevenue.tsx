import { getRevenue } from '../api/dashboard'
import { KpiRow } from '../components/KpiRow'
import { LoadError } from '../components/LoadError'
import { MonthlyRevenueCard } from '../components/revenue/MonthlyRevenueCard'
import { RevenueByAreaCard } from '../components/revenue/RevenueByAreaCard'
import { RevenueByLineCard } from '../components/revenue/RevenueByLineCard'
import { SeasonalityCard } from '../components/revenue/SeasonalityCard'
import { TopClientsTable } from '../components/revenue/TopClientsTable'
import { pageName } from '../data/kpis'
import { useQuadraData } from '../useQuadraData'
import { useQuadraFilters } from '../useQuadraFilters'
import { useScrollToHash } from '../useScrollToHash'
import { NARROW, ROW, WIDE } from './layout'

export function QuadraRevenue() {
    const { filters, period } = useQuadraFilters()
    const { data, error, retry } = useQuadraData(getRevenue, filters)
    useScrollToHash(data !== null)

    if (error) {
        return (
            <>
                <h1 className="sr-only">{pageName('revenue')}</h1>
                <LoadError error={error} onRetry={retry} />
            </>
        )
    }

    return (
        <>
            <h1 className="sr-only">{pageName('revenue')}</h1>

            <KpiRow
                ids={['revenue', 'activeClients', 'avgRevenue', 'top3Share']}
                kpis={data?.kpis ?? null}
                compareLabel={period.compareLabel}
            />

            <MonthlyRevenueCard months={data?.monthly ?? null} period={period} />

            <div className={ROW}>
                <div className={WIDE}>
                    <RevenueByLineCard rows={data?.byLine ?? null} period={period} />
                </div>
                <div className={NARROW}>
                    <RevenueByAreaCard data={data?.byArea ?? null} period={period} />
                </div>
            </div>

            <div className={ROW}>
                <div className={WIDE}>
                    <TopClientsTable rows={data?.topClients ?? null} period={period} />
                </div>
                <div className={NARROW}>
                    <SeasonalityCard data={data?.seasonality ?? null} />
                </div>
            </div>
        </>
    )
}
