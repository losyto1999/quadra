import { TOP_CLIENTS } from '../../data/rules'
import type { OverviewData } from '../../data/types'
import { formatPercent, formatPercentRounded } from '../../utils/format'
import { translate as t } from '../../i18n/locale'
import { Card } from '../Card'
import { COLORS } from '../charts/chartStyle'
import { Swatch } from '../charts/Swatch'
import { Skeleton } from '../Skeleton'

const TOP_COLORS = [COLORS.ink, COLORS.accent, COLORS.accentSoft]

/** Quanto pesano i primi clienti (TOP_CLIENTS) sui ricavi del periodo. */
export function ClientConcentrationCard({ data }: { data: OverviewData['concentration'] | null }) {
    if (!data) {
        return (
            <Card title={t('overview.concentration.title')} loading>
                <Skeleton width={96} height={40} />
                <Skeleton height={14} radius={999} />
                <Skeleton width="80%" />
                <Skeleton width="70%" />
                <Skeleton width="75%" />
            </Card>
        )
    }

    const segments = [
        ...data.top.map((c, i) => ({ key: String(c.id), label: c.name, share: c.share, color: TOP_COLORS[i] })),
        { key: 'others', label: t('overview.concentration.others'), share: data.othersShare, color: COLORS.track },
    ]
    const description = t('overview.concentration.description', {
        items: segments.map((s) => `${s.label} ${formatPercent(s.share)}`).join(', '),
    })

    return (
        <Card title={t('overview.concentration.title')}>
            <div>
                <p className="text-big leading-none font-extrabold tracking-[-0.02em] text-accent">
                    {formatPercentRounded(data.share)}
                </p>
                <p className="mt-1 text-sm text-muted">{t('overview.concentration.caption', { n: TOP_CLIENTS, total: data.activeClients })}</p>
            </div>
            {/* Barra segmentata: ogni tratto cresce in proporzione alla sua quota, separati da 2px di vuoto. */}
            <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={description}>
                {segments.map((s) => (
                    <span key={s.key} className="min-w-0.5 basis-0" style={{ flexGrow: s.share, background: s.color }} />
                ))}
            </div>
            <ol className="flex flex-col gap-2 text-label">
                {data.top.map((c, i) => (
                    <li key={c.id} className="flex items-center gap-2">
                        <Swatch color={TOP_COLORS[i]} />
                        <span className="min-w-0 flex-1">{c.name}</span>
                        <span className="font-bold tabular-nums">{formatPercent(c.share)}</span>
                    </li>
                ))}
            </ol>
        </Card>
    )
}
