import { Link } from 'react-router-dom'
import { KPI_DEFS, kpiLabel, pageName } from '../data/kpis'
import type { KpiId } from '../data/kpis'
import type { KpiValue } from '../data/types'
import { paths } from '../routes'
import { formatValue } from '../utils/format'
import { translate as t } from '../i18n/locale'
import { useFilterSearch } from '../useQuadraFilters'
import { DeltaBadge } from './DeltaBadge'
import { Skeleton } from './Skeleton'

interface KpiCardProps {
    id: KpiId
    /** null mentre i dati arrivano. */
    kpi: KpiValue | null
    compareLabel: string
}

const CARD =
    'flex min-h-full min-w-0 scroll-mt-4 flex-col items-start gap-1.5 rounded-kpi border-2 border-transparent bg-surface p-5'
const LABEL = 'text-label font-semibold text-muted'

/** Metrica con variazione. Porta alla card che la approfondisce, conservando i filtri. */
export function KpiCard({ id, kpi, compareLabel }: KpiCardProps) {
    const def = KPI_DEFS[id]
    const search = useFilterSearch()
    const label = kpi?.label ?? kpiLabel(id)

    if (!kpi) {
        return (
            <div className={CARD} aria-busy="true">
                <span className={LABEL}>{label}</span>
                <Skeleton width="70%" height={30} />
                <span className="mt-auto pt-1">
                    <Skeleton width={76} height={24} radius={999} />
                </span>
            </div>
        )
    }

    return (
        <Link
            to={{ pathname: paths[def.page], search, hash: `#${def.section}` }}
            className={`${CARD} text-inherit no-underline transition-colors duration-150 hover:border-accent-soft`}
        >
            <span className={LABEL}>{label}</span>
            <span className="text-kpi leading-[1.15] font-extrabold tracking-[-0.02em] text-ink">
                {formatValue(def.format, kpi.value)}
            </span>
            {kpi.note && <span className="text-label text-muted">{kpi.note}</span>}
            <span className="mt-auto pt-1">
                <DeltaBadge
                    kind={def.delta}
                    polarity={def.polarity}
                    value={kpi.value}
                    previous={kpi.previous}
                    compareLabel={compareLabel}
                />
            </span>
            <span className="sr-only">{t('kpiCard.detail', { page: pageName(def.page) })}</span>
        </Link>
    )
}
