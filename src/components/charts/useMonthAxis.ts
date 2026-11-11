import { currentLocale } from '../../i18n/locale'
import { SMALL, useMediaQuery } from '../../useMediaQuery'
import { tickStyle } from './chartStyle'

/** Iniziale del mese ("G", "F"… / "J", "F"…): per it ed en coincide con la forma `narrow` di Intl. */
const initial = (label: string) => label.charAt(0).toLocaleUpperCase(currentLocale())

/**
 * Assi dei grafici con un punto al mese. Su mobile la colonna dei valori in euro si stringe per dare
 * spazio al grafico e le etichette dei mesi rimpiccioliscono; con più di sei mesi (circa 16px a testa
 * a 320px) resta solo l'iniziale, come nei calendari. Il nome intero è nel tooltip.
 */
export function useMonthAxis({ dark = false, yWidth = 64, points = 12 }: { dark?: boolean; yWidth?: number; points?: number } = {}) {
    const narrow = useMediaQuery(SMALL)
    const initials = narrow && points > 6
    return {
        xTick: { ...tickStyle(dark), fontSize: narrow ? (initials ? 11 : 10) : 12 },
        xTickFormatter: initials ? initial : undefined,
        yWidth: narrow ? yWidth - 14 : yWidth,
    }
}
