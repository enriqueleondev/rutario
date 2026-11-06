// Motivo gráfico de Rutario (tomado de los logos): pin con palomita y ruta punteada en coral.

/** Pin de la marca para fondos oscuros (aqua + palomita navy) o claros (teal + palomita blanca). */
export function MarcaPin({ className = 'w-10 h-10', oscuro = false }: { className?: string; oscuro?: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <path d="M14 98 C 28 84, 34 114, 52 106" fill="none" stroke="#FF6B3D" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 9" />
      <circle cx="14" cy="98" r="6" fill="#FF6B3D" />
      <path d="M64 108 C 52 92, 32 74, 32 47 A32 32 0 1 1 96 47 C 96 74, 76 92, 64 108 Z" fill={oscuro ? '#2EE6C5' : '#0F8F82'} />
      <path d="M49 48 L60 59 L80 37" fill="none" stroke={oscuro ? '#0B1630' : '#FFFFFF'} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Dibujo grande de fondo para pantallas oscuras (login): pin en contorno y ruta punteada que lo recorre. */
export function RutaDecor({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="-70 -10 260 150" className={className} aria-hidden="true" fill="none">
      <path d="M-66 132 C -40 100, -30 140, -6 112 S 10 96, 14 98 C 28 84, 34 114, 52 106" stroke="#FF6B3D" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0.1 6" />
      <circle cx="14" cy="98" r="3.4" fill="#FF6B3D" />
      <path d="M64 108 C 52 92, 32 74, 32 47 A32 32 0 1 1 96 47 C 96 74, 76 92, 64 108 Z" stroke="#2EE6C5" strokeOpacity=".5" strokeWidth="1.4" />
      <path d="M49 48 L60 59 L80 37" stroke="#2EE6C5" strokeOpacity=".5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Ruta que se dibuja sola con un pin que flota: encabezado del panel principal. */
export function RutaAnimada({ className = '' }: { className?: string }) {
  const d = 'M10 110 C 90 110, 90 40, 170 50 S 270 122, 340 82 S 440 22, 500 44'
  return (
    <svg viewBox="0 0 520 140" className={className} aria-hidden="true">
      <path d={d} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="3" strokeLinecap="round" />
      <path d={d} pathLength={1} fill="none" stroke="#2EE6C5" strokeWidth="3" strokeLinecap="round" className="anim-draw" />
      <circle cx="10" cy="110" r="6" fill="#2EE6C5" />
      <circle cx="170" cy="50" r="5" fill="#FF6B3D" />
      <circle cx="340" cy="82" r="5" fill="#2EE6C5" />
      <g className="anim-bob">
        <path d="M500 30c0 12-12 20-12 20s-12-8-12-20a12 12 0 0 1 24 0Z" fill="#FF6B3D" />
        <circle cx="488" cy="30" r="4.5" fill="#0B1630" />
      </g>
    </svg>
  )
}

/** Punto verde que late: indica algo «en vivo». */
export function PuntoVivo({ className = '' }: { className?: string }) {
  return (
    <span className={`relative inline-block w-2.5 h-2.5 ${className}`} aria-hidden="true">
      <span className="absolute inset-0 rounded-full bg-brand anim-ping" />
      <span className="absolute inset-0 rounded-full bg-brand" />
    </span>
  )
}
