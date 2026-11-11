import { CircleAlert, Info, TriangleAlert } from 'lucide-react'
import type { Alert, Severity } from '../data/types'
import { cx } from '../utils/cx'
import { translate as t } from '../i18n/locale'
import { Card } from './Card'
import { Skeleton } from './Skeleton'

// La gravità si legge dal fondo, dall'icona e, per i lettori di schermo, dal testo: mai dal solo colore.
const SEVERITY: Record<Severity, { Icon: typeof Info; row: string; icon: string }> = {
    critical: { Icon: CircleAlert, row: 'bg-alert-red', icon: 'text-negative' },
    warning: { Icon: TriangleAlert, row: 'bg-alert-amber', icon: 'text-amber-ink' },
    info: { Icon: Info, row: 'bg-alert-info', icon: 'text-accent' },
}

interface AlertListProps {
    alerts: Alert[] | null
    title?: string
    id?: string
    /** Righe di skeleton durante il caricamento. */
    placeholderRows?: number
}

/** Avvisi generati dai dati, nella forma "**Soggetto** · descrizione". */
export function AlertList({ alerts, title, id, placeholderRows = 3 }: AlertListProps) {
    return (
        <Card title={title ?? t('alerts.title')} id={id} loading={alerts === null}>
            {alerts === null ? (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: placeholderRows }, (_, i) => (
                        <Skeleton key={i} height={46} radius={14} />
                    ))}
                </div>
            ) : (
                <ul className="flex flex-col gap-2">
                    {alerts.map((alert) => {
                        const { Icon, row, icon } = SEVERITY[alert.severity]
                        return (
                            <li
                                key={alert.id}
                                className={cx('flex items-start gap-2.5 rounded-alert px-3.5 py-3 text-sm leading-[1.45]', row)}
                            >
                                <Icon className={cx('mt-0.5 size-4 shrink-0', icon)} aria-hidden="true" strokeWidth={2.25} />
                                <span>
                                    <span className="sr-only">{t(`alerts.severity.${alert.severity}`)}: </span>
                                    <strong className="font-bold">{alert.subject}</strong> · {alert.description}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            )}
        </Card>
    )
}
