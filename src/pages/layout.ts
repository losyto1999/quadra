// Griglia delle pagine: righe di card affiancate che vanno a capo, colonna singola sotto i 900px.
// Ogni cella fa riempire alla sua card tutta l'altezza della riga.

export const ROW = 'flex flex-wrap items-stretch gap-4'
/** Righe con una card molto più lunga dell'altra (tabelle): ognuna tiene la sua altezza. */
export const ROW_TOP = 'flex flex-wrap items-start gap-4'

export const WIDE = 'min-w-0 flex-[3_1_560px] compact:basis-full *:h-full'
export const HALF = 'min-w-0 flex-[1_1_440px] compact:basis-full *:h-full'
export const NARROW = 'min-w-0 flex-[2_1_360px] compact:basis-full *:h-full'
