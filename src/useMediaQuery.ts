import { useCallback, useSyncExternalStore } from 'react'

/** true finché la media query corrisponde; si aggiorna al ridimensionamento o al cambio di preferenza. */
export function useMediaQuery(query: string) {
    const subscribe = useCallback(
        (onChange: () => void) => {
            const list = window.matchMedia(query)
            list.addEventListener('change', onChange)
            return () => list.removeEventListener('change', onChange)
        },
        [query],
    )

    return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}

/** Stessa soglia della variante `small:` di quadra.css (< 640px). */
export const SMALL = '(max-width: 639.98px)'

/** «Riduci movimento» attivo nel sistema: i grafici compaiono senza animazione. */
export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')
