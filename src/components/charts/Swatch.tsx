export type SwatchShape = 'line' | 'dashed' | 'rect' | 'dot'

interface SwatchProps {
    color: string
    shape?: SwatchShape
    opacity?: number
}

/** Il segno di una serie, uguale nella legenda e nel tooltip: linea per le linee, quadrato per barre e aree. */
export function Swatch({ color, shape = 'rect', opacity = 1 }: SwatchProps) {
    return (
        <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true" style={{ flexShrink: 0 }}>
            {shape === 'rect' && <rect x="3" y="0" width="10" height="10" rx="3" fill={color} fillOpacity={opacity} />}
            {shape === 'dot' && <circle cx="8" cy="5" r="5" fill={color} fillOpacity={opacity} />}
            {(shape === 'line' || shape === 'dashed') && (
                <line
                    x1="1"
                    y1="5"
                    x2="15"
                    y2="5"
                    stroke={color}
                    strokeOpacity={opacity}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={shape === 'dashed' ? '3 3' : undefined}
                />
            )}
        </svg>
    )
}
