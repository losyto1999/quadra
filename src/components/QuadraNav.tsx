import { NavLink } from 'react-router-dom'
import { translate as t } from '../i18n/locale'
import type { PageKey } from '../routes'
import { paths } from '../routes'
import { useFilterSearch } from '../useQuadraFilters'
import { cx } from '../utils/cx'

const PAGES: PageKey[] = ['overview', 'revenue', 'costs', 'cash']

/**
 * Navigazione a pillole. I link conservano i filtri: valgono per tutte le pagine.
 * Sotto i 640px resta su una sola riga a tutta larghezza: le voci si dividono lo spazio e si stringono.
 */
export function QuadraNav() {
    const search = useFilterSearch()
    return (
        <nav aria-label={t('nav.label')} className="w-fit rounded-full bg-surface p-[5px] small:w-full">
            <ul className="flex flex-wrap gap-1 small:flex-nowrap small:justify-center small:gap-0.5">
                {PAGES.map((page) => (
                    <li key={page} className="small:min-w-0 small:flex-auto">
                        <NavLink
                            to={{ pathname: paths[page], search }}
                            end
                            className={({ isActive }) =>
                                cx(
                                    'inline-flex min-h-11 items-center rounded-full px-[18px] text-sm font-semibold whitespace-nowrap no-underline small:w-full small:justify-center small:px-1.5 small:text-xs',
                                    isActive ? 'bg-ink text-white' : 'text-muted hover:bg-chip hover:text-ink',
                                )
                            }
                        >
                            {t(`pages.${page}`)}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
