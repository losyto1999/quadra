import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Porta in vista la card indicata dall'hash (es. /costi#margini-linea, dal clic su una KpiCard) e la
 * evidenzia per un attimo. Aspetta `ready`, cioè i dati: prima gli skeleton hanno altezze diverse e la
 * card finirebbe fuori posto. Una volta sola per navigazione: se poi i dati si ricaricano (per esempio
 * al cambio di lingua) la pagina resta dov'è.
 */
export function useScrollToHash(ready: boolean) {
    const { hash, key } = useLocation()
    const handled = useRef<string | null>(null)

    useEffect(() => {
        if (!ready || !hash || handled.current === key) return
        const target = document.getElementById(decodeURIComponent(hash.slice(1)))
        if (!target) return
        handled.current = key
        target.scrollIntoView({ block: 'start' })
        target.setAttribute('data-highlight', '')
        // Niente cleanup: l'evidenziazione deve finire anche se nel frattempo l'effetto si ripete.
        window.setTimeout(() => target.removeAttribute('data-highlight'), 1800)
    }, [ready, hash, key])
}
