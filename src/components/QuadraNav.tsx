import { ChartPie, LayoutDashboard, TrendingUp, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { NavLink } from 'react-router-dom'
import { translate as t } from '../i18n/locale'
import type { PageKey } from '../routes'
import { paths } from '../routes'
import { useFilterSearch } from '../useQuadraFilters'
import { cx } from '../utils/cx'

const PAGES: { page: PageKey; icon: LucideIcon }[] = [
    { page: 'overview', icon: LayoutDashboard },
    { page: 'revenue', icon: TrendingUp },
    { page: 'costs', icon: ChartPie },
    { page: 'cash', icon: Wallet },
]

/**
 * Navigazione. Da 640px in su è a pillole, senza icone. Sotto i 640px diventa una tab bar fissa in
 * basso, a portata di pollice: una pillola lunga quanto la riga, come quella del desktop, con icona sopra
 * e nome corto sotto e la voce attiva scura. L'evidenziazione scorre da una voce all'altra (layoutId); `layoutRoot` perché la barra è fissa e la pagina scorre.
 * I link conservano i filtri: valgono per tutte le pagine.
 */
export function QuadraNav() {
    const search = useFilterSearch()
    const reduceMotion = useReducedMotion()
    return (
        <motion.nav
            layoutRoot
            aria-label={t('nav.label')}
            className="w-fit rounded-full bg-surface p-[5px] small:fixed small:inset-x-4 small:bottom-[max(12px,env(safe-area-inset-bottom))] small:z-40 small:w-auto nav-3d"
        >
            <ul className="flex flex-wrap gap-1 small:flex-nowrap small:gap-0">
                {PAGES.map(({ page, icon: Icon }) => (
                    <li key={page} className="small:min-w-0 small:flex-1">
                        <NavLink
                            to={{ pathname: paths[page], search }}
                            end
                            className={({ isActive }) =>
                                cx(
                                    'relative inline-flex min-h-11 items-center rounded-full px-[18px] text-sm font-semibold whitespace-nowrap no-underline transition-colors duration-200',
                                    'small:min-h-14 small:w-full small:flex-col small:justify-center small:gap-1 small:px-0 small:text-[11px] small:leading-none',
                                    isActive ? 'text-white' : 'text-muted hover:bg-chip hover:text-ink',
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.span
                                            aria-hidden="true"
                                            layoutId="nav-active"
                                            transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 40 }}
                                            className="nav-3d-active absolute inset-0 rounded-full bg-ink"
                                        />
                                    )}
                                    <Icon aria-hidden="true" strokeWidth={2.25} className="relative hidden small:block small:size-5" />
                                    <span className="relative small:hidden">{t(`pages.${page}`)}</span>
                                    <span className="relative hidden small:block small:max-w-full small:truncate">{t(`pagesShort.${page}`)}</span>
                                </>
                            )}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </motion.nav>
    )
}
