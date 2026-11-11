import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './quadra.css'
import './i18n'
import './portfolio/fromPortfolio'
import App from './App.tsx'

// Su GitHub Pages l'app vive in un sottopercorso (`/quadra/`): il router lo riceve da Vite.
// Senza la barra finale, così funziona anche `/quadra` oltre a `/quadra/`.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter basename={basename}>
            <App />
        </BrowserRouter>
    </StrictMode>,
)
