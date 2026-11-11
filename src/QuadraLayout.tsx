import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { FilterBar } from './components/FilterBar'
import { QuadraHeader } from './components/QuadraHeader'
import { useLocale } from './i18n/locale'

/** Header e barra dei filtri, comuni a tutte le pagine. */
export function QuadraLayout() {
    const location = useLocation()
    const navigationType = useNavigationType()
    // Header e filtri usano `translate()`: leggere la lingua qui li fa ri-renderizzare quando cambia.
    // Le pagine si aggiornano da sole: useQuadraData ricarica i dati nella lingua nuova.
    useLocale()

    // react-router non riporta in cima la pagina nuova: lo facciamo qui, ma solo quando cambia
    // il percorso. I filtri cambiano la query string e non devono far saltare la pagina; le
    // ancore delle KpiCard le gestisce ogni pagina con useScrollToHash, appena ha i dati.
    const previousPath = useRef<string | null>(null)
    useEffect(() => {
        if (previousPath.current === location.pathname) return
        previousPath.current = location.pathname
        if (!location.hash && navigationType !== 'POP') window.scrollTo({ top: 0, behavior: 'instant' })
    }, [location.pathname, location.hash, navigationType])

    return (
        <div className="quadra-root px-8 py-7 small:px-4">
            <div className="mx-auto flex max-w-[1320px] flex-col gap-4">
                <QuadraHeader />
                <FilterBar />
                <main className="flex min-w-0 flex-col gap-4">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
