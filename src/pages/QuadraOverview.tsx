import { getOverview } from '../api/dashboard'
import { AlertList } from '../components/AlertList'
import { InsightCard } from '../components/InsightCard'
import { KpiCard } from '../components/KpiCard'
import { LoadError } from '../components/LoadError'
import { CostBreakdownCard } from '../components/costs/CostBreakdownCard'
import { CashForecastCard } from '../components/overview/CashForecastCard'
import { ClientConcentrationCard } from '../components/overview/ClientConcentrationCard'
import { RevenueHeroCard } from '../components/overview/RevenueHeroCard'
import { pageName } from '../data/kpis'
import { translate as t } from '../i18n/locale'
import { useQuadraData } from '../useQuadraData'
import { useQuadraFilters } from '../useQuadraFilters'
import { useScrollToHash } from '../useScrollToHash'

// Riga 2: quattro card affiancate (i costi con un po' più di spazio per ciambella e legenda),
// 2×2 alle larghezze medie, una colonna sotto i 900px.
const BOTTOM_CELL = 'min-w-0 flex-[1_1_250px] medium:basis-[calc(50%_-_8px)] compact:basis-full *:h-full'
const BOTTOM_COSTS = 'min-w-0 flex-[1.3_1_330px] medium:flex-[1_1_calc(50%_-_8px)] compact:basis-full *:h-full'

export function QuadraOverview() {
    const { filters, period } = useQuadraFilters()
    const { data, error, retry } = useQuadraData(getOverview, filters)
    useScrollToHash(data !== null)

    if (error) {
        return (
            <>
                <h1 className="sr-only">{pageName('overview')}</h1>
                <LoadError error={error} onRetry={retry} />
            </>
        )
    }

    return (
        <>
            <h1 className="sr-only">{pageName('overview')}</h1>

            {/* Riga 1: card scura (flex 2) e colonna con le KPI 2×2 e l'insight (flex 1). */}
            <div className="flex flex-wrap gap-4">
                <div className="min-w-0 flex-[2_1_560px] compact:basis-full *:h-full">
                    <RevenueHeroCard data={data?.hero ?? null} period={period} />
                </div>
                <div className="grid flex-[1_1_380px] grid-cols-2 content-start gap-4 compact:basis-full compact:grid-cols-1">
                    <KpiCard id="grossMargin" kpi={data?.kpis.grossMargin ?? null} compareLabel={period.compareLabel} />
                    <KpiCard id="ebitda" kpi={data?.kpis.ebitda ?? null} compareLabel={period.compareLabel} />
                    <KpiCard id="liquidity" kpi={data?.kpis.liquidity ?? null} compareLabel={period.compareLabel} />
                    <KpiCard id="overdue" kpi={data?.kpis.overdue ?? null} compareLabel={period.compareLabel} />
                    <div className="col-span-full">
                        <InsightCard text={data?.insight ?? null} />
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-stretch gap-4">
                <div className={BOTTOM_COSTS}>
                    <CostBreakdownCard title={t('overview.costsTitle')} data={data?.costs ?? null} />
                </div>
                <div className={BOTTOM_CELL}>
                    <ClientConcentrationCard data={data?.concentration ?? null} />
                </div>
                <div className={BOTTOM_CELL}>
                    <CashForecastCard forecast={data?.forecast ?? null} />
                </div>
                <div className={BOTTOM_CELL}>
                    <AlertList alerts={data?.alerts ?? null} />
                </div>
            </div>
        </>
    )
}
