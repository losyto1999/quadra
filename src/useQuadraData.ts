import { useEffect, useState } from 'react'
import type { RequestOptions } from './api/dashboard'
import { isAbortError } from './api/mock'
import type { QuadraFilters } from './data/calendar'
import { useLocale } from './i18n/locale'

type Loader<T> = (filters: QuadraFilters, options?: RequestOptions) => Promise<T>

/**
 * Chiama un'API della dashboard a ogni cambio di filtri o di lingua (i testi arrivano già tradotti).
 * Finché la risposta per la richiesta attuale non arriva, `data` è null e le card mostrano gli
 * skeleton: lo stato si ricava nello stesso render in cui cambiano i filtri, quindi i dati vecchi non
 * restano a video nemmeno per un frame. La richiesta superata viene annullata e la sua risposta
 * scartata: dopo cambi rapidi vince sempre l'ultima. Se l'API rifiuta, `error` contiene l'errore e
 * `retry` riprova.
 */
export function useQuadraData<T>(load: Loader<T>, filters: QuadraFilters) {
    const { year, period } = filters
    const { lang } = useLocale()
    const [attempt, setAttempt] = useState(0)
    const key = `${year}:${period}:${lang}:${attempt}`
    const [result, setResult] = useState<{ key: string; data: T | null; error: unknown } | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        const settle = (data: T | null, error: unknown) => {
            if (!controller.signal.aborted) setResult({ key, data, error })
        }
        load({ year, period }, { signal: controller.signal }).then(
            (data) => settle(data, null),
            (error: unknown) => {
                if (!isAbortError(error)) settle(null, error)
            },
        )
        return () => controller.abort()
    }, [load, year, period, key])

    const current = result?.key === key ? result : null
    return {
        data: current?.data ?? null,
        error: current?.error ?? null,
        loading: current === null,
        retry: () => setAttempt((n) => n + 1),
    }
}
