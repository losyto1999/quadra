// Strumenti comuni delle API simulate: l'app non ha un backend e non fa chiamate di rete.
// I numeri vengono da un dataset generato nel browser (src/data/): nessun dato lascia il browser.

const MIN_LATENCY_MS = 300
const MAX_LATENCY_MS = 600

/** L'errore che `fetch` dà quando la richiesta viene annullata con il suo AbortSignal. */
const abortError = () => new DOMException('The operation was aborted.', 'AbortError')

/**
 * Risolve con il valore calcolato dopo un'attesa tra 300 e 600 ms, come una chiamata di rete; se il
 * calcolo lancia, rifiuta. Varia solo l'attesa: `value` è deterministica. Come `fetch`, si può annullare
 * con un AbortSignal: rifiuta con un `AbortError` e il calcolo non parte.
 */
export function delay<T>(value: () => T, signal?: AbortSignal) {
    return new Promise<T>((resolve, reject) => {
        if (signal?.aborted) return reject(abortError())
        const timer = setTimeout(
            () => {
                signal?.removeEventListener('abort', onAbort)
                try {
                    resolve(value())
                } catch (error) {
                    reject(error)
                }
            },
            MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS),
        )
        function onAbort() {
            clearTimeout(timer)
            reject(abortError())
        }
        signal?.addEventListener('abort', onAbort, { once: true })
    })
}

/** La richiesta è stata annullata (filtri o lingua cambiati prima della risposta): non è un errore da mostrare. */
export const isAbortError = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'
