import logo from '../assets/header.webp'
import { COMPANY, companyNote } from '../data/company'
import { LanguageSwitch } from './LanguageSwitch'
import { QuadraNav } from './QuadraNav'

/**
 * Scritta Quadra e azienda a sinistra, nav e lingua a destra. Fino a 1180px la nav scende su una riga
 * sua, sotto, e la lingua resta in alto accanto alla scritta; sotto i 640px la nav occupa tutta la riga.
 * Aperta dal portfolio, lascia a sinistra lo spazio per la pillola "torna al portfolio" (back:).
 */
export function QuadraHeader() {
    return (
        <header className="flex flex-wrap items-center gap-x-6 gap-y-4 small:gap-x-3 back:clear-back-pill">
            <div className="min-w-0 flex-1">
                <h1 className="m-0">
                    <img src={logo} alt="Quadra" width={440} height={107} className="h-9 w-auto small:h-8" />
                </h1>
                <p className="mt-1 text-label text-muted">
                    {COMPANY.name} · {companyNote()}
                </p>
            </div>
            <div className="tablet:order-last tablet:w-full">
                <QuadraNav />
            </div>
            <LanguageSwitch />
        </header>
    )
}
