// Numeri pseudo-casuali deterministici: ogni valore dipende solo dagli interi che lo identificano
// (cliente, mese, "sale"), non dall'ordine in cui viene chiesto. Stessi dati a ogni caricamento.

const SEED = 0x452821e6

/** Valore in [0, 1) ricavato dagli interi passati (hash di tipo mulberry32). */
export function hash01(...parts: number[]) {
    let h = SEED
    for (const part of parts) {
        h = Math.imul(h ^ (part | 0), 0x9e3779b1)
        h ^= h >>> 15
    }
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b)
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
}

/** Fattore 1 ± amount (es. amount 0.03 -> tra 0,97 e 1,03). */
export function jitter(amount: number, ...parts: number[]) {
    return 1 + (hash01(...parts) * 2 - 1) * amount
}

/** Intero tra min e max compresi. */
export function intBetween(min: number, max: number, ...parts: number[]) {
    return min + Math.floor(hash01(...parts) * (max - min + 1))
}
