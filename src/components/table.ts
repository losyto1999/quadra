// Classi delle tabelle di Quadra: righe separate da linee track, intestazioni muted 12px, cifre
// incolonnate. Sotto la larghezza minima la tabella scorre in orizzontale nel suo contenitore.

export const TABLE_SCROLL = 'relative -mx-1 overflow-x-auto px-1'

const TABLE = [
    'w-full border-collapse text-sm tabular-nums',
    '[&_th]:px-3 [&_th]:pb-2.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:whitespace-nowrap [&_th]:text-muted',
    '[&_td]:border-t [&_td]:border-track [&_td]:p-3 [&_td]:align-middle',
    '[&_:is(th,td):first-child]:pl-0 [&_:is(th,td):last-child]:pr-0',
    '[&_tfoot_td]:border-t-2 [&_tfoot_td]:font-bold',
].join(' ')

/** Classi della tabella; `compact` per quelle con poche colonne, nelle card strette (larghezza minima più bassa). */
export const tableClass = (compact = false) => `${TABLE} ${compact ? 'min-w-[420px]' : 'min-w-[560px]'}`

/** Colonne di importi e date, allineate a destra (vince sull'allineamento a sinistra delle intestazioni). */
export const NUM = 'text-right! whitespace-nowrap'

export const NAME = 'font-semibold'
