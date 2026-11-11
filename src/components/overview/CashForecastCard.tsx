import type { Forecast } from '../../data/types'
import { formatEuroCompact } from '../../utils/format'
import { translate as t } from '../../i18n/locale'
import { FORECAST_MONTHS } from '../../data/generate'
import { Card } from '../Card'
import { ForecastBars } from '../charts/ForecastBars'
import { Skeleton } from '../Skeleton'

/** Liquidità prevista nella Panoramica. Non dipende dal filtro: guarda avanti dalla data di riferimento. */
export function CashForecastCard({ forecast }: { forecast: Forecast | null }) {
    return (
        <Card
            title={t('overview.forecast.title')}
            subtitle={
                forecast
                    ? t('overview.forecast.subtitle', { months: FORECAST_MONTHS, range: forecast.rangeLabel })
                    : t('overview.forecast.subtitleLoading', { months: FORECAST_MONTHS })
            }
            loading={!forecast}
        >
            {forecast ? (
                <>
                    <ForecastBars forecast={forecast} height={170} />
                    <p className="text-sm text-muted">
                        {t('overview.forecast.low', { month: forecast.min.name })}{' '}
                        <strong className="font-extrabold text-ink">{formatEuroCompact(forecast.min.balance)}</strong>
                    </p>
                </>
            ) : (
                <>
                    <Skeleton width="70%" />
                    <Skeleton height={170} radius={12} />
                    <Skeleton width="80%" />
                </>
            )}
        </Card>
    )
}
