import { currentLang, currentLocale, translate as t } from '../i18n/locale'
import type { DeltaKind, ValueFormat } from '../data/types'

// Formati di Quadra, tutti qui, nella lingua attiva (it-IT o en-GB). Nulla è calcolato una volta sola
// all'import: la lingua si può cambiare in qualsiasi momento, quindi ogni funzione la legge al momento
// della chiamata (i formattatori Intl restano in cache, uno per lingua).
//
// In italiano tra simbolo, numero e unità c'è uno spazio unificatore, così "€ 3,84 M" non va mai a
// capo a metà; in inglese si scrive "€3.84M". Intl mette l'euro dopo il numero ("3.840.000,00 €") e in
// italiano non raggruppa le cifre sotto le 5 ("1250"): per questo la valuta è composta a mano e il
// raggruppamento è forzato con 'always'.

/** Spazio unificatore (U+00A0) e segno meno tipografico (U+2212), scritti per codice: a vista sembrerebbero uno spazio e un trattino. */
const NBSP = String.fromCharCode(0x00a0)
const MINUS = String.fromCharCode(0x2212)

interface Formats {
    integer: Intl.NumberFormat
    oneDecimal: Intl.NumberFormat
    twoDecimals: Intl.NumberFormat
    upToTwoDecimals: Intl.NumberFormat
    date: Intl.DateTimeFormat
    shortMonth: Intl.DateTimeFormat
    longMonth: Intl.DateTimeFormat
}

const cache = new Map<string, Formats>()

function formats(): Formats {
    const locale = currentLocale()
    let found = cache.get(locale)
    if (!found) {
        found = {
            integer: new Intl.NumberFormat(locale, { maximumFractionDigits: 0, useGrouping: 'always' }),
            oneDecimal: new Intl.NumberFormat(locale, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
                useGrouping: 'always',
            }),
            twoDecimals: new Intl.NumberFormat(locale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                useGrouping: 'always',
            }),
            upToTwoDecimals: new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }),
            date: new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }),
            shortMonth: new Intl.DateTimeFormat(locale, { month: 'short' }),
            longMonth: new Intl.DateTimeFormat(locale, { month: 'long' }),
        }
        cache.set(locale, found)
    }
    return found
}

/** Spazio tra simbolo, numero e unità: unificatore in italiano, nessuno in inglese ("€3.84M"). */
const gap = () => (currentLang() === 'en' ? '' : NBSP)

/** "gen", "feb"… "dic" / "Jan"… "Dec": sempre tre lettere, anche in inglese (en-GB scrive "Sept"). */
export function monthShort(month: number) {
    const date = new Date(2024, month, 1)
    return currentLang() === 'en' ? formats().longMonth.format(date).slice(0, 3) : formats().shortMonth.format(date)
}

/** "gennaio"… "dicembre" / "January"… "December". */
export const monthLong = (month: number) => formats().longMonth.format(new Date(2024, month, 1))

const sign = (value: number) => (value < 0 ? MINUS : '')

/** 452310 -> "€ 452.310" / "€452,310". */
export function formatEuro(value: number) {
    return `${sign(value)}€${gap()}${formats().integer.format(Math.abs(Math.round(value)))}`
}

/** 3840000 -> "€ 3,84 M", 452310 -> "€ 452 k", 940 -> "€ 940". */
export function formatEuroCompact(value: number) {
    const abs = Math.abs(value)
    const { integer, twoDecimals } = formats()
    if (abs >= 999_500) return `${sign(value)}€${gap()}${twoDecimals.format(abs / 1_000_000)}${gap()}M`
    if (abs >= 1_000) return `${sign(value)}€${gap()}${integer.format(abs / 1_000)}${gap()}k`
    return formatEuro(value)
}

/** Etichette degli assi: come formatEuroCompact, ma senza decimali inutili ("€ 1 M", "€ 1,5 M"). */
export function formatEuroAxis(value: number) {
    const abs = Math.abs(value)
    const { integer, upToTwoDecimals } = formats()
    if (abs >= 1_000_000) return `${sign(value)}€${gap()}${upToTwoDecimals.format(abs / 1_000_000)}${gap()}M`
    if (abs >= 1_000) return `${sign(value)}€${gap()}${integer.format(abs / 1_000)}${gap()}k`
    return `${sign(value)}€${gap()}${integer.format(abs)}`
}

/** 0.341 -> "34,1%". */
export function formatPercent(ratio: number) {
    return `${sign(ratio)}${formats().oneDecimal.format(Math.abs(ratio * 100))}%`
}

/** 0.41 -> "41%". */
export function formatPercentRounded(ratio: number) {
    return `${sign(ratio)}${formats().integer.format(Math.abs(ratio * 100))}%`
}

/** Differenza tra due percentuali, in punti: 0.009 -> "0,9 pp". Senza segno: lo dà la freccia. */
export function formatPoints(ratioDiff: number) {
    return `${formats().oneDecimal.format(Math.abs(ratioDiff * 100))}${NBSP}pp`
}

/** 1250 -> "1.250". */
export function formatNumber(value: number) {
    return `${sign(value)}${formats().integer.format(Math.abs(Math.round(value)))}`
}

/** 68 -> "68 giorni", 1 -> "1 giorno". */
export function formatDays(days: number) {
    const n = Math.round(days)
    return t('format.days', { count: Math.abs(n), value: formatNumber(n) })
}

/** "15/07/2026". */
export function formatDate(date: Date) {
    return formats().date.format(date)
}

/**
 * "1 fattura", "3 fatture": il testo sta in locales/*.json alla chiave `counts.<key>` (con i
 * suffissi `_one` e `_other`) e il numero è già formattato in `{{value}}`.
 */
export function formatCount(key: string, n: number) {
    return t(`counts.${key}`, { count: n, value: formatNumber(n) })
}

/** Valore di una KPI nel suo formato. */
export function formatValue(format: ValueFormat, value: number) {
    if (format === 'euro') return formatEuroCompact(value)
    if (format === 'percent') return formatPercent(value)
    if (format === 'days') return formatDays(value)
    return formatNumber(value)
}

/** Variazione senza segno (lo dà la freccia): "6,4%", "0,9 pp", "4 gg", "2". */
export function formatDelta(kind: DeltaKind, delta: number) {
    const abs = Math.abs(delta)
    if (kind === 'relative') return formatPercent(abs)
    if (kind === 'points') return formatPoints(abs)
    if (kind === 'days') return `${formatNumber(abs)}${NBSP}${t('format.daysShort')}`
    return formatNumber(abs)
}

/** La stessa variazione a parole, per i lettori di schermo: "del 6,4%", "di 0,9 punti percentuali". */
export function describeDelta(kind: DeltaKind, delta: number) {
    const abs = Math.abs(delta)
    if (kind === 'relative') return t('format.delta.relative', { value: formatPercent(abs) })
    if (kind === 'points') return t('format.delta.points', { value: formats().oneDecimal.format(abs * 100) })
    if (kind === 'days') return t('format.delta.days', { value: formatDays(abs) })
    return t('format.delta.count', { value: formatNumber(abs) })
}
