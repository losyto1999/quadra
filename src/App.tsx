import { Navigate, Route, Routes } from 'react-router-dom'
import { QuadraLayout } from './QuadraLayout'
import { QuadraCash } from './pages/QuadraCash'
import { QuadraCosts } from './pages/QuadraCosts'
import { QuadraOverview } from './pages/QuadraOverview'
import { QuadraRevenue } from './pages/QuadraRevenue'
import { paths } from './routes'

function App() {
    return (
        <Routes>
            <Route element={<QuadraLayout />}>
                <Route index element={<QuadraOverview />} />
                <Route path={paths.revenue} element={<QuadraRevenue />} />
                <Route path={paths.costs} element={<QuadraCosts />} />
                <Route path={paths.cash} element={<QuadraCash />} />
            </Route>

            {/* I percorsi sconosciuti tornano alla Panoramica. */}
            <Route path="*" element={<Navigate to={paths.overview} replace />} />
        </Routes>
    )
}

export default App
