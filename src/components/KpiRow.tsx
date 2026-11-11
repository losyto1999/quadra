import type { KpiId } from '../data/kpis'
import type { KpiValue } from '../data/types'
import { KpiCard } from './KpiCard'

interface KpiRowProps {
    ids: KpiId[]
    kpis: Partial<Record<KpiId, KpiValue>> | null
    compareLabel: string
}

/** Le quattro KPI in testa alle pagine di dettaglio: 4 colonne, 2 alle larghezze medie, 1 sotto i 900px. */
export function KpiRow({ ids, kpis, compareLabel }: KpiRowProps) {
    return (
        <div className="grid grid-cols-4 gap-4 tablet:grid-cols-2 compact:grid-cols-1">
            {ids.map((id) => (
                <KpiCard key={id} id={id} kpi={kpis?.[id] ?? null} compareLabel={compareLabel} />
            ))}
        </div>
    )
}
