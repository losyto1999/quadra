/** Unisce le classi saltando quelle condizionali false. */
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ')
