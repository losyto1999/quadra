import { cx } from '../utils/cx'

interface SkeletonProps {
    width?: number | string
    height?: number | string
    radius?: number
    /** Su fondo scuro (card hero) o sul lime dell'insight. */
    tone?: 'light' | 'dark' | 'lime'
}

const TONES = {
    light: 'bg-track',
    dark: 'bg-hero-grid',
    lime: 'bg-ink/15',
}

/** Blocco segnaposto mentre l'API risponde. Decorativo: lo stato lo annuncia aria-busy sulla card. */
export function Skeleton({ width = '100%', height = 16, radius, tone = 'light' }: SkeletonProps) {
    return (
        <span
            aria-hidden="true"
            className={cx('block max-w-full shrink-0 animate-pulse rounded-lg motion-reduce:animate-none', TONES[tone])}
            style={{ width, height, borderRadius: radius }}
        />
    )
}
