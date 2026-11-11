// La demo si apre anche dal portfolio (flowsi.it), che la linka con `?from=portfolio`. Solo in quel
// caso compare la pillola per tornare indietro: chi arriva da GitHub o da un link diretto non la vede.
// Il portfolio sta su un altro dominio e non può scrivere nello storage di questa pagina, quindi il
// segnale arriva nell'URL; qui lo si salva nel sessionStorage, così resta valido navigando tra le
// pagine della demo, e lo si toglie dall'URL, così un link copiato non lo porta con sé.

const PARAM = 'from'
const VALUE = 'portfolio'
const STORAGE_KEY = 'portfolio:back'

/** Dove riporta la pillola. È fisso, e non letto dall'URL, perché nessuno possa usarla per mandare altrove. */
export const PORTFOLIO_URL = 'https://flowsi.it/#progetti'

const url = new URL(window.location.href)
if (url.searchParams.get(PARAM) === VALUE) {
    try {
        sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
        // Storage bloccato (navigazione privata, cookie disattivati): la pillola semplicemente non compare.
    }
    url.searchParams.delete(PARAM)
    window.history.replaceState(window.history.state, '', url)
}

/** True se in questa scheda la demo è stata aperta dal portfolio. */
export function cameFromPortfolio() {
    try {
        return sessionStorage.getItem(STORAGE_KEY) === '1'
    } catch {
        return false
    }
}

// Segnale per il CSS: la variante `back:` (definita nel foglio di stile della demo) lascia spazio alla pillola.
if (cameFromPortfolio()) document.documentElement.dataset.portfolioBack = ''
