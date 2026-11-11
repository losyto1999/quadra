import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: {
        rolldownOptions: {
            output: {
                // Le librerie in file a parte: nessun file supera i 500 kB e restano in cache
                // del browser quando cambia solo il codice dell'app.
                codeSplitting: {
                    groups: [
                        {
                            name: 'react',
                            test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|use-sync-external-store)[\\/]/,
                        },
                        // Recharts e le sue dipendenze: d3, redux (lo stato interno dei grafici), immer…
                        {
                            name: 'recharts',
                            test: /node_modules[\\/](recharts|d3-[^\\/]+|internmap|victory-vendor|@reduxjs[\\/]toolkit|react-redux|redux|redux-thunk|reselect|immer|decimal\.js-light|es-toolkit|eventemitter3|tiny-invariant|clsx)[\\/]/,
                        },
                        { name: 'vendor', test: /node_modules[\\/]/ },
                    ],
                },
            },
        },
    },
})
