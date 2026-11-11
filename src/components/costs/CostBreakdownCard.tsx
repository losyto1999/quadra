import type { CostCategoryId } from '../../data/company'
import type { Breakdown } from '../../data/types'
import { Card } from '../Card'
import { DonutChart, DonutSkeleton } from '../charts/DonutChart'

interface CostBreakdownCardProps {
    title: string
    data: Breakdown<CostCategoryId> | null
    id?: string
    subtitle?: string
    size?: number
}

/** Costi per categoria in ciambella: la stessa card in Panoramica e in Costi e margini. */
export function CostBreakdownCard({ title, data, id, subtitle, size = 136 }: CostBreakdownCardProps) {
    return (
        <Card title={title} subtitle={subtitle} id={id} loading={!data}>
            {data ? (
                <DonutChart data={data} subject={title} size={size} />
            ) : (
                <DonutSkeleton size={size} />
            )}
        </Card>
    )
}
