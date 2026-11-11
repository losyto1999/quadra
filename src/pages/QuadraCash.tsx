import { getCash } from '../api/dashboard'
import { KpiRow } from '../components/KpiRow'
import { LoadError } from '../components/LoadError'
import { CashFlowCard } from '../components/cash/CashFlowCard'
import { CashForecastHeroCard } from '../components/cash/CashForecastHeroCard'
import { OverdueInvoicesTable } from '../components/cash/OverdueInvoicesTable'
import { ReceivablesAgingCard } from '../components/cash/ReceivablesAgingCard'
import { pageName } from '../data/kpis'
import { useQuadraData } from '../useQuadraData'
import { useQuadraFilters } from '../useQuadraFilters'
import { useScrollToHash } from '../useScrollToHash'
import { HALF, NARROW, ROW, ROW_TOP, WIDE } from './layout'

export function QuadraCash() {
    const { filters, period } = useQuadraFilters()
    const { data, error, retry } = useQuadraData(getCash, filters)
    useScrollToHash(data !== null)

    if (error) {
        return (
            <>
                <h1 className="sr-only">{pageName('cash')}</h1>
                <LoadError error={error} onRetry={retry} />
            </>
        )
    }

    return (
        <>
            <h1 className="sr-only">{pageName('cash')}</h1>

            <KpiRow ids={['liquidity', 'dso', 'dpo', 'overdue']} kpis={data?.kpis ?? null} compareLabel={period.compareLabel} />

            <div className={ROW}>
                <div className={HALF}>
                    <CashForecastHeroCard forecast={data?.forecast ?? null} />
                </div>
                <div className={HALF}>
                    <CashFlowCard rows={data?.flows ?? null} period={period} />
                </div>
            </div>

            <div className={ROW_TOP}>
                <div className={NARROW}>
                    <ReceivablesAgingCard rows={data?.aging ?? null} period={period} />
                </div>
                <div className={WIDE}>
                    <OverdueInvoicesTable data={data?.overdue ?? null} period={period} />
                </div>
            </div>
        </>
    )
}
