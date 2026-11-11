import type { Forecast } from '../../data/types'
import { sections } from '../../routes'
import { formatEuroCompact } from '../../utils/format'
import { translate as t } from '../../i18n/locale'
import { Card } from '../Card'
import { ForecastBars } from '../charts/ForecastBars'
import { HeroHeader } from '../HeroHeader'
import { Skeleton } from '../Skeleton'

const HEIGHT = 260

/** Card scura di Cassa: liquidità prevista nei prossimi sei mesi, con la soglia minima. */
export function CashForecastHeroCard({ forecast }: { forecast: Forecast | null }) {
    return (
        <Card id={sections.cashForecast} dark loading={!forecast}>
            <HeroHeader
                label={forecast ? t('cash.forecastHero.titleWithRange', { range: forecast.rangeLabel }) : t('cash.forecastHero.title')}
                value={forecast ? formatEuroCompact(forecast.min.balance) : null}
            >
                {forecast
                    ? t('cash.forecastHero.lowDetail', { month: forecast.min.longLabel, threshold: formatEuroCompact(forecast.threshold) })
                    : t('cash.forecastHero.low')}
            </HeroHeader>
            {forecast ? (
                <ForecastBars forecast={forecast} height={HEIGHT} dark />
            ) : (
                <>
                    <Skeleton tone="dark" width="50%" />
                    <Skeleton tone="dark" height={HEIGHT} radius={12} />
                </>
            )}
        </Card>
    )
}
